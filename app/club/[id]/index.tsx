import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Share, View } from 'react-native';
import { BookPickerModal } from '@/components/BookPickerModal';
import { AppText, Avatar, Badge, BookCover, Button, Card, ErrorState, Loading, Row, Screen, Section } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ensureBook } from '@/lib/books';
import { fmtDateTime, timeAgo } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Book, Club, Meeting, Round, roundPhase } from '@/lib/types';

type Member = { user_id: string; role: 'owner' | 'member'; profiles: { display_name: string } | null };
type Announcement = { id: string; kind: string; body: string; created_at: string; books: Book | null };

export default function ClubOverview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [picker, setPicker] = useState(false);

  const { data, loading, error, reload, refreshing, refresh } = useData(async () => {
    await supabase.rpc('close_due_rounds');
    const [club, members, rounds, meeting, news] = await Promise.all([
      supabase.from('clubs').select('*, books:current_book_id(*)').eq('id', id).maybeSingle(),
      supabase.from('club_members').select('user_id,role,profiles:user_id(display_name)').eq('club_id', id).order('joined_at'),
      supabase.from('club_rounds').select('*').eq('club_id', id).order('created_at', { ascending: false }).limit(5),
      supabase
        .from('club_meetings')
        .select('*, books:book_id(*)')
        .eq('club_id', id)
        .eq('status', 'planned')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(1),
      supabase
        .from('club_announcements')
        .select('id,kind,body,created_at,books:book_id(*)')
        .eq('club_id', id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    if (club.error) throw club.error;
    return {
      club: club.data as unknown as Club | null,
      members: (members.data ?? []) as unknown as Member[],
      rounds: (rounds.data ?? []) as Round[],
      nextMeeting: ((meeting.data ?? [])[0] ?? null) as unknown as Meeting | null,
      news: (news.data ?? []) as unknown as Announcement[],
    };
  }, [id]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  if (!data.club) return <ErrorState message={t('common.notFound')} />;

  const { club, members, rounds, nextMeeting, news } = data;
  const isOwner = club.owner_id === user!.id;
  const activeRound = rounds.find((r) => roundPhase(r) !== 'closed');

  const shareCode = () =>
    Share.share({ message: t('clubs.shareMessage', { name: club.name, code: club.join_code }) });

  const setCurrent = async (book: Book) => {
    try {
      const bookId = await ensureBook(book);
      const { error } = await supabase.from('clubs').update({ current_book_id: bookId }).eq('id', club.id);
      if (error) throw error;
      reload();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  const leave = () =>
    Alert.alert(t('clubs.leave'), t('clubs.leaveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('clubs.leave'),
        style: 'destructive',
        onPress: async () => {
          await supabase.from('club_members').delete().eq('club_id', club.id).eq('user_id', user!.id);
          router.replace('/(tabs)/clubs');
        },
      },
    ]);

  const del = () =>
    Alert.alert(t('clubs.delete'), t('clubs.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('clubs.delete'),
        style: 'destructive',
        onPress: async () => {
          await supabase.from('clubs').delete().eq('id', club.id);
          router.replace('/(tabs)/clubs');
        },
      },
    ]);

  const book = club.books;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: club.name }} />
      {club.description ? <AppText muted>{club.description}</AppText> : null}

      <Section title={t('club.currentRead')}>
        {book ? (
          <Card onPress={() => router.push(`/book/${encodeURIComponent(book.external_id)}`)}>
            <Row style={{ alignItems: 'flex-start' }}>
              <BookCover url={book.cover_url} title={book.title} width={64} />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="subheading">{book.title}</AppText>
                <AppText variant="caption" muted>
                  {(book.authors ?? []).join(', ')}
                </AppText>
              </View>
            </Row>
          </Card>
        ) : (
          <AppText muted>{t('club.noCurrent')}</AppText>
        )}
        <Row>
          <Button
            style={{ flex: 1 }}
            small
            icon="sparkles-outline"
            title={t('club.discussion')}
            onPress={() => router.push(book ? `/discussion?book=${encodeURIComponent(book.external_id)}&club=${club.id}` : '/discussion')}
          />
          {isOwner ? <Button small variant="secondary" title={t('club.choose')} onPress={() => setPicker(true)} /> : null}
        </Row>
      </Section>

      <Section title={t('club.nextMeeting')}>
        {nextMeeting ? (
          <Card onPress={() => router.push(`/club/meeting/${nextMeeting.id}`)}>
            <AppText variant="subheading">{nextMeeting.title}</AppText>
            <AppText>{fmtDateTime(nextMeeting.starts_at)}</AppText>
            {nextMeeting.place_name ? (
              <AppText variant="caption" muted>
                📍 {nextMeeting.place_name}
              </AppText>
            ) : null}
          </Card>
        ) : (
          <AppText muted>{t('club.noMeeting')}</AppText>
        )}
        <Button small variant="secondary" icon="calendar-outline" title={t('club.meetings')} onPress={() => router.push(`/club/${club.id}/meetings`)} />
      </Section>

      <Section title={t('club.voting')}>
        {activeRound ? (
          <Card onPress={() => router.push(`/club/round/${activeRound.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <AppText variant="subheading">{activeRound.title}</AppText>
              <Badge label={t(`phase.${roundPhase(activeRound)}` as any)} color={colors.primary} />
            </Row>
          </Card>
        ) : (
          <AppText muted>{t('club.noRound')}</AppText>
        )}
        <Button small variant="secondary" icon="trophy-outline" title={t('club.allRounds')} onPress={() => router.push(`/club/${club.id}/rounds`)} />
      </Section>

      {news.length ? (
        <Section title={t('club.announcements')}>
          {news.map((n) => (
            <Card key={n.id}>
              <AppText>{n.kind === 'winner' ? `🏆 ${t('club.winnerAnnounce', { title: n.body })}` : n.body}</AppText>
              <AppText variant="caption" muted>
                {timeAgo(n.created_at)}
              </AppText>
            </Card>
          ))}
        </Section>
      ) : null}

      <Section title={t('club.invite')}>
        <Card>
          <AppText variant="caption" muted>
            {t('club.codeHint')}
          </AppText>
          <AppText variant="title" style={{ letterSpacing: 6, textAlign: 'center' }}>
            {club.join_code}
          </AppText>
          <Button icon="share-outline" title={t('club.share')} onPress={shareCode} />
        </Card>
      </Section>

      <Section title={t('club.members', { n: members.length })}>
        {members.map((m) => (
          <Row key={m.user_id}>
            <Avatar name={m.profiles?.display_name ?? '?'} size={32} />
            <AppText style={{ flex: 1 }}>{m.profiles?.display_name}</AppText>
            {m.role === 'owner' ? <Badge label={t('club.owner')} /> : null}
          </Row>
        ))}
      </Section>

      {isOwner ? (
        <Button variant="ghost" title={t('clubs.delete')} onPress={del} />
      ) : (
        <Button variant="ghost" title={t('clubs.leave')} onPress={leave} />
      )}

      <BookPickerModal visible={picker} onClose={() => setPicker(false)} onPick={setCurrent} title={t('club.choose')} />
    </Screen>
  );
}
