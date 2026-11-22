import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { BookPickerModal } from '@/components/BookPickerModal';
import { AppText, Avatar, Badge, BookCover, Button, Card, EmptyState, ErrorState, Loading, Row, Screen, Section } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ensureBook } from '@/lib/books';
import { authorLine, fmtDateTime } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { radius, useTheme } from '@/lib/theme';
import { Book, Round, roundPhase } from '@/lib/types';

type Nomination = {
  id: string;
  book_id: string;
  nominated_by: string;
  books: Book;
  profiles: { display_name: string; avatar_url?: string | null } | null;
};
type Vote = { user_id: string; nomination_id: string; profiles: { display_name: string; avatar_url?: string | null } | null };

export default function RoundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload, refreshing, refresh } = useData(async () => {
    await supabase.rpc('close_due_rounds');
    const { data: round, error: e1 } = await supabase.from('club_rounds').select('*').eq('id', id).maybeSingle();
    if (e1) throw e1;
    if (!round) return null;
    const [club, noms, votes, results] = await Promise.all([
      supabase.from('clubs').select('owner_id').eq('id', round.club_id).maybeSingle(),
      supabase
        .from('round_nominations')
        .select('id,book_id,nominated_by,books(*),profiles:nominated_by(display_name,avatar_url)')
        .eq('round_id', id)
        .order('created_at'),
      supabase.from('round_votes').select('user_id,nomination_id,profiles:user_id(display_name,avatar_url)').eq('round_id', id),
      supabase.rpc('round_results', { p_round: id }),
    ]);
    const counts: Record<string, number> = {};
    ((results.data ?? []) as { nomination_id: string; votes: number }[]).forEach((r) => (counts[r.nomination_id] = Number(r.votes)));
    return {
      round: round as Round,
      ownerId: club.data?.owner_id as string | undefined,
      noms: (noms.data ?? []) as unknown as Nomination[],
      votes: (votes.data ?? []) as unknown as Vote[],
      counts,
      showCounts: (results.data ?? []).length > 0 || (noms.data ?? []).length === 0,
    };
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title={t('common.notFound')} />;

  const { round, noms, votes, counts, showCounts } = data;
  const phase = roundPhase(round);
  const isOwner = data.ownerId === user!.id;
  const myVote = votes.find((v) => v.user_id === user!.id)?.nomination_id;
  const winner = noms.find((n) => n.book_id === round.winner_book_id);

  const guard = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) Alert.alert(t('common.error'), error.message);
    else reload();
  };

  const nominate = async (book: Book) => {
    try {
      const bookId = await ensureBook(book);
      await guard(() => supabase.from('round_nominations').insert({ round_id: id, book_id: bookId, nominated_by: user!.id }));
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  // One vote per round: tapping another book moves your vote, tapping your pick removes it.
  const toggleVote = (nominationId: string) =>
    guard(() =>
      myVote === nominationId
        ? supabase.from('round_votes').delete().eq('round_id', id).eq('user_id', user!.id)
        : supabase.from('round_votes').upsert({ round_id: id, user_id: user!.id, nomination_id: nominationId }, { onConflict: 'round_id,user_id' }),
    );

  const closeNow = () =>
    Alert.alert(t('round.closeNow'), t('round.closeNowConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('round.closeNow'), style: 'destructive', onPress: () => guard(() => supabase.rpc('finalize_round_now', { p_round: id })) },
    ]);

  const sorted = [...noms].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
  const list = phase === 'closed' ? sorted : noms;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: round.title }} />

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Badge label={t(`phase.${phase}` as any)} color={phase === 'closed' ? colors.border : colors.primary} />
          <AppText variant="caption" muted>
            {round.anonymous ? `🕶️ ${t('rounds.anonymousShort')}` : `👀 ${t('rounds.publicShort')}`}
          </AppText>
        </Row>
        <AppText variant="caption" muted>
          {t('rounds.nomUntil', { date: fmtDateTime(round.nominations_deadline) })}
        </AppText>
        <AppText variant="caption" muted>
          {t('rounds.voteUntil', { date: fmtDateTime(round.voting_deadline) })}
        </AppText>
      </Card>

      {phase === 'closed' && winner ? (
        <Card style={{ borderColor: colors.accent, borderWidth: 2 }}>
          <AppText variant="label">
            🏆 {t('round.winner')}
          </AppText>
          <Row style={{ alignItems: 'flex-start' }}>
            <BookCover url={winner.books.cover_url} title={winner.books.title} width={64} />
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{winner.books.title}</AppText>
              <AppText muted>{authorLine(winner.books.authors)}</AppText>
              <AppText variant="caption" muted style={{ marginTop: 6 }}>
                {t('round.nowCurrent')}
              </AppText>
            </View>
          </Row>
        </Card>
      ) : null}
      {phase === 'closed' && !winner ? <AppText muted>{t('round.noWinner')}</AppText> : null}

      {phase === 'nominating' ? (
        <Button icon="add" title={t('round.nominate')} onPress={() => setPicker(true)} disabled={busy} />
      ) : null}
      {phase === 'voting' ? <AppText muted>{t('round.voteHint')}</AppText> : null}
      {phase === 'voting' && round.anonymous ? <AppText variant="caption" muted>{t('round.hiddenCounts')}</AppText> : null}

      <Section title={t('round.nominations', { n: noms.length })}>
        {list.length === 0 ? <EmptyState icon="book-outline" title={t('round.noNominations')} /> : null}
        {list.map((n) => {
          const mine = myVote === n.id;
          const voters = votes.filter((v) => v.nomination_id === n.id);
          return (
            <Card
              key={n.id}
              style={mine ? { borderColor: colors.primary, borderWidth: 2 } : undefined}
            >
              <Pressable onPress={() => router.push(`/book/${encodeURIComponent(n.books.external_id)}`)}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <BookCover url={n.books.cover_url} title={n.books.title} width={52} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <AppText variant="subheading" numberOfLines={2}>
                      {n.books.title}
                    </AppText>
                    <AppText variant="caption" muted numberOfLines={1}>
                      {authorLine(n.books.authors)}
                    </AppText>
                    <AppText variant="caption" muted>
                      {t('round.nominatedBy', { name: n.nominated_by === user!.id ? t('common.you') : n.profiles?.display_name ?? '?' })}
                    </AppText>
                  </View>
                  {showCounts ? (
                    <View style={{ alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 }}>
                      <AppText variant="heading">{counts[n.id] ?? 0}</AppText>
                      <AppText variant="caption" muted>
                        {t('round.votes')}
                      </AppText>
                    </View>
                  ) : null}
                </Row>
              </Pressable>

              {!round.anonymous && voters.length > 0 ? (
                <Row gap={4} style={{ flexWrap: 'wrap' }}>
                  {voters.map((v) => (
                    <Avatar key={v.user_id} name={v.profiles?.display_name ?? '?'} url={v.profiles?.avatar_url} size={24} />
                  ))}
                </Row>
              ) : null}

              {phase === 'voting' ? (
                <Button
                  small
                  variant={mine ? 'primary' : 'secondary'}
                  icon={mine ? 'checkmark-circle' : 'ellipse-outline'}
                  title={mine ? t('round.yourVote') : t('round.vote')}
                  onPress={() => toggleVote(n.id)}
                  disabled={busy}
                />
              ) : null}
              {phase === 'nominating' && n.nominated_by === user!.id ? (
                <Button
                  small
                  variant="ghost"
                  title={t('common.delete')}
                  onPress={() => guard(() => supabase.from('round_nominations').delete().eq('id', n.id))}
                />
              ) : null}
            </Card>
          );
        })}
      </Section>

      {isOwner && phase !== 'closed' ? <Button variant="ghost" title={t('round.closeNow')} onPress={closeNow} /> : null}

      <BookPickerModal visible={picker} onClose={() => setPicker(false)} onPick={nominate} title={t('round.nominate')} />
    </Screen>
  );
}
