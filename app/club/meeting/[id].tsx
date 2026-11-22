import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { AppText, Avatar, Badge, BookCover, Button, Card, EmptyState, ErrorState, Input, Loading, Row, Screen, Section, Segmented } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { authorLine, fmtDateTime, timeAgo } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { cancelMeetingReminders, scheduleMeetingReminders } from '@/lib/notifications';
import { mapsUrl } from '@/lib/places';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import type { Meeting, RsvpStatus } from '@/lib/types';

type Rsvp = { user_id: string; status: RsvpStatus; profiles: { display_name: string; avatar_url?: string | null } | null };
type Note = { id: string; user_id: string; body: string; created_at: string; profiles: { display_name: string; avatar_url?: string | null } | null };

export default function MeetingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload, refreshing, refresh } = useData(async () => {
    const { data: meeting, error: e1 } = await supabase.from('club_meetings').select('*, books:book_id(*)').eq('id', id).maybeSingle();
    if (e1) throw e1;
    if (!meeting) return null;
    const [club, rsvps, notes] = await Promise.all([
      supabase.from('clubs').select('owner_id,name').eq('id', meeting.club_id).maybeSingle(),
      supabase.from('meeting_rsvps').select('user_id,status,profiles:user_id(display_name,avatar_url)').eq('meeting_id', id),
      supabase.from('meeting_notes').select('id,user_id,body,created_at,profiles:user_id(display_name,avatar_url)').eq('meeting_id', id).order('created_at'),
    ]);
    return {
      meeting: meeting as unknown as Meeting,
      ownerId: club.data?.owner_id as string | undefined,
      rsvps: (rsvps.data ?? []) as unknown as Rsvp[],
      notes: (notes.data ?? []) as unknown as Note[],
    };
  }, [id]);

  useEffect(() => {
    if (data?.meeting) setSummary(data.meeting.summary ?? '');
  }, [data?.meeting?.summary]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title={t('common.notFound')} />;

  const { meeting, rsvps, notes } = data;
  const canManage = meeting.created_by === user!.id || data.ownerId === user!.id;
  const myRsvp = rsvps.find((r) => r.user_id === user!.id)?.status;
  const past = new Date(meeting.starts_at) < new Date();
  const book = meeting.books;

  const guard = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) Alert.alert(t('common.error'), error.message);
    else reload();
  };

  const setRsvp = async (status: RsvpStatus) => {
    await guard(() =>
      supabase.from('meeting_rsvps').upsert({ meeting_id: id, user_id: user!.id, status, updated_at: new Date().toISOString() }),
    );
    if (status === 'going') scheduleMeetingReminders(meeting);
    else cancelMeetingReminders(meeting.id);
  };

  const addNote = async () => {
    await guard(() => supabase.from('meeting_notes').insert({ meeting_id: id, user_id: user!.id, body: note.trim() }));
    setNote('');
  };

  const saveSummary = async () => {
    await guard(() => supabase.from('club_meetings').update({ summary: summary.trim() || null }).eq('id', id));
    setEditing(false);
  };

  const aiSummary = async () => {
    setBusy(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('discussion-questions', {
        body: {
          mode: 'summary',
          language: lang,
          title: book?.title ?? meeting.title,
          authors: authorLine(book?.authors),
          notes: notes.map((n) => n.body),
        },
      });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      setSummary(String(res.summary ?? ''));
      setEditing(true);
    } catch (e: any) {
      Alert.alert(t('common.error'), t('meeting.aiFailed'));
    } finally {
      setBusy(false);
    }
  };

  const toggleCancel = () =>
    guard(() => supabase.from('club_meetings').update({ status: meeting.status === 'cancelled' ? 'planned' : 'cancelled' }).eq('id', id));

  const remove = () =>
    Alert.alert(t('meeting.delete'), t('meeting.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('meeting.delete'),
        style: 'destructive',
        onPress: async () => {
          await supabase.from('club_meetings').delete().eq('id', id);
          cancelMeetingReminders(meeting.id);
          router.back();
        },
      },
    ]);

  const group = (s: RsvpStatus) => rsvps.filter((r) => r.status === s);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: '' }} />
      <AppText variant="title">{meeting.title}</AppText>
      {meeting.status === 'cancelled' ? <Badge label={t('meeting.cancelled')} color={colors.danger} /> : null}

      <Card>
        <AppText variant="subheading">🗓️ {fmtDateTime(meeting.starts_at)}</AppText>
        {meeting.place_name ? (
          <>
            <AppText>📍 {meeting.place_name}</AppText>
            {meeting.place_address ? (
              <AppText variant="caption" muted>
                {meeting.place_address}
              </AppText>
            ) : null}
            <Button small variant="secondary" icon="map-outline" title={t('place.openMaps')} onPress={() => Linking.openURL(mapsUrl(meeting))} />
          </>
        ) : (
          <AppText muted>{t('meeting.noPlace')}</AppText>
        )}
        {meeting.description ? <AppText>{meeting.description}</AppText> : null}
      </Card>

      {book ? (
        <Card onPress={() => router.push(`/book/${encodeURIComponent(book.external_id)}`)}>
          <Row style={{ alignItems: 'flex-start' }}>
            <BookCover url={book.cover_url} title={book.title} width={48} />
            <View style={{ flex: 1 }}>
              <AppText variant="subheading">{book.title}</AppText>
              <AppText variant="caption" muted>
                {authorLine(book.authors)}
              </AppText>
            </View>
          </Row>
        </Card>
      ) : null}

      {meeting.status === 'planned' ? (
        <Section title={t('meeting.rsvp')}>
          <Segmented<RsvpStatus>
            value={(myRsvp ?? '') as RsvpStatus}
            onChange={setRsvp}
            options={[
              { value: 'going', label: t('rsvp.going') },
              { value: 'maybe', label: t('rsvp.maybe') },
              { value: 'no', label: t('rsvp.no') },
            ]}
          />
          {(['going', 'maybe', 'no'] as RsvpStatus[]).map((s) =>
            group(s).length ? (
              <View key={s} style={{ gap: 6 }}>
                <AppText variant="caption" muted>
                  {t(`rsvp.${s}` as any)} · {group(s).length}
                </AppText>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  {group(s).map((r) => (
                    <Row key={r.user_id} gap={6}>
                      <Avatar name={r.profiles?.display_name ?? '?'} url={r.profiles?.avatar_url} size={26} />
                      <AppText variant="caption">{r.profiles?.display_name}</AppText>
                    </Row>
                  ))}
                </Row>
              </View>
            ) : null,
          )}
          {!past ? (
            <AppText variant="caption" muted>
              🔔 {t('meeting.reminderHint')}
            </AppText>
          ) : null}
        </Section>
      ) : null}

      <Button
        icon="sparkles-outline"
        title={t('meeting.discussion')}
        onPress={() =>
          router.push(`/discussion?${book ? `book=${encodeURIComponent(book.external_id)}&` : ''}club=${meeting.club_id}`)
        }
      />

      <Section title={t('meeting.summary')}>
        {editing ? (
          <>
            <Input value={summary} onChangeText={setSummary} multiline style={{ minHeight: 140 }} />
            <Row>
              <Button small title={t('common.save')} onPress={saveSummary} loading={busy} />
              <Button small variant="ghost" title={t('common.cancel')} onPress={() => (setEditing(false), setSummary(meeting.summary ?? ''))} />
            </Row>
          </>
        ) : (
          <>
            {meeting.summary ? <Card><AppText>{meeting.summary}</AppText></Card> : <AppText muted>{t('meeting.noSummary')}</AppText>}
            {canManage ? (
              <Row>
                <Button small variant="secondary" icon="create-outline" title={t('meeting.editSummary')} onPress={() => setEditing(true)} />
                <Button small variant="secondary" icon="sparkles-outline" title={t('meeting.aiSummary')} onPress={aiSummary} loading={busy} disabled={notes.length === 0} />
              </Row>
            ) : null}
          </>
        )}
      </Section>

      <Section title={t('meeting.notes')}>
        {notes.length === 0 ? <AppText muted>{t('meeting.noNotes')}</AppText> : null}
        {notes.map((n) => (
          <Card key={n.id}>
            <Row style={{ alignItems: 'flex-start' }}>
              <Avatar name={n.profiles?.display_name ?? '?'} url={n.profiles?.avatar_url} size={28} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" style={{ fontWeight: '700' }}>
                  {n.user_id === user!.id ? t('common.you') : n.profiles?.display_name}
                  <AppText variant="caption" muted>
                    {'  '}
                    {timeAgo(n.created_at)}
                  </AppText>
                </AppText>
                <AppText>{n.body}</AppText>
              </View>
              {n.user_id === user!.id ? (
                <AppText variant="caption" muted onPress={() => guard(() => supabase.from('meeting_notes').delete().eq('id', n.id))}>
                  {t('common.delete')}
                </AppText>
              ) : null}
            </Row>
          </Card>
        ))}
        <Input value={note} onChangeText={setNote} multiline placeholder={t('meeting.notePlaceholder')} />
        <Button small icon="add" title={t('meeting.addNote')} onPress={addNote} loading={busy} disabled={!note.trim()} />
      </Section>

      {canManage ? (
        <View style={{ gap: 6 }}>
          <Button variant="ghost" title={meeting.status === 'cancelled' ? t('meeting.restore') : t('meeting.cancel')} onPress={toggleCancel} />
          <Button variant="ghost" title={t('meeting.delete')} onPress={remove} />
        </View>
      ) : null}
    </Screen>
  );
}
