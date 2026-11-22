import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { AppText, Badge, Button, Card, EmptyState, ErrorState, Loading, Row, Screen, Section } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { scheduleMeetingReminders } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import type { Meeting } from '@/lib/types';

type Poll = { id: string; title: string; closes_at: string | null; status: 'open' | 'closed'; created_at: string };

export default function Meetings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data, loading, error, reload, refreshing, refresh } = useData(async () => {
    const [club, meetings, polls, rsvps] = await Promise.all([
      supabase.from('clubs').select('owner_id').eq('id', id).maybeSingle(),
      supabase.from('club_meetings').select('*').eq('club_id', id).order('starts_at', { ascending: true }),
      supabase.from('date_polls').select('*').eq('club_id', id).eq('status', 'open').order('created_at', { ascending: false }),
      supabase.from('meeting_rsvps').select('meeting_id,status').eq('user_id', user!.id),
    ]);
    if (meetings.error) throw meetings.error;
    const list = (meetings.data ?? []) as Meeting[];
    // Refresh this device's reminders for meetings the user is going to.
    const going = new Set((rsvps.data ?? []).filter((r: any) => r.status === 'going').map((r: any) => r.meeting_id));
    list
      .filter((m) => m.status === 'planned' && going.has(m.id) && new Date(m.starts_at) > new Date())
      .forEach((m) => scheduleMeetingReminders(m));
    return {
      ownerId: club.data?.owner_id as string | undefined,
      meetings: list,
      polls: (polls.data ?? []) as Poll[],
      rsvp: Object.fromEntries((rsvps.data ?? []).map((r: any) => [r.meeting_id, r.status])) as Record<string, string>,
    };
  }, [id, user?.id]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const now = new Date();
  const upcoming = data.meetings.filter((m) => new Date(m.starts_at) >= now && m.status === 'planned');
  const past = data.meetings.filter((m) => new Date(m.starts_at) < now || m.status === 'cancelled').reverse();
  const isOwner = data.ownerId === user!.id;

  const MeetingCard = ({ m }: { m: Meeting }) => (
    <Card onPress={() => router.push(`/club/meeting/${m.id}`)}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AppText variant="subheading" style={{ flex: 1 }}>
          {m.title}
        </AppText>
        {m.status === 'cancelled' ? <Badge label={t('meeting.cancelled')} color={colors.danger} /> : null}
        {data.rsvp[m.id] ? <Badge label={t(`rsvp.${data.rsvp[m.id]}` as any)} /> : null}
      </Row>
      <AppText>{fmtDateTime(m.starts_at)}</AppText>
      {m.place_name ? (
        <AppText variant="caption" muted>
          📍 {m.place_name}
        </AppText>
      ) : null}
    </Card>
  );

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: t('club.meetings') }} />
      <Row>
        {isOwner ? (
          <Button style={{ flex: 1 }} icon="calendar-outline" title={t('meeting.schedule')} onPress={() => router.push(`/club/meeting/new?club=${id}`)} />
        ) : null}
        <Button style={{ flex: 1 }} variant="secondary" icon="help-circle-outline" title={t('poll.suggest')} onPress={() => router.push(`/club/poll/new?club=${id}`)} />
      </Row>
      {!isOwner ? (
        <AppText variant="caption" muted>
          {t('meeting.ownerSchedules')}
        </AppText>
      ) : null}

      {data.polls.length ? (
        <Section title={t('poll.open')}>
          {data.polls.map((p) => (
            <Card key={p.id} onPress={() => router.push(`/club/poll/${p.id}`)}>
              <AppText variant="subheading">🗳️ {p.title}</AppText>
              {p.closes_at ? (
                <AppText variant="caption" muted>
                  {t('poll.closes', { date: fmtDateTime(p.closes_at) })}
                </AppText>
              ) : null}
            </Card>
          ))}
        </Section>
      ) : null}

      <Section title={t('meeting.upcoming')}>
        {upcoming.length === 0 ? <EmptyState icon="calendar-outline" title={t('meeting.none')} /> : null}
        {upcoming.map((m) => (
          <MeetingCard key={m.id} m={m} />
        ))}
      </Section>

      {past.length ? (
        <Section title={t('meeting.past')}>
          <View style={{ gap: 10 }}>
            {past.map((m) => (
              <MeetingCard key={m.id} m={m} />
            ))}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}
