import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, View } from 'react-native';
import { AppText, Avatar, Badge, Button, Card, EmptyState, ErrorState, Loading, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

type Option = { id: string; starts_at: string };
type PollVote = { option_id: string; user_id: string; profiles: { display_name: string } | null };

export default function PollScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { data, loading, error, reload, refreshing, refresh } = useData(async () => {
    const { data: poll, error: e1 } = await supabase.from('date_polls').select('*').eq('id', id).maybeSingle();
    if (e1) throw e1;
    if (!poll) return null;
    const [club, options] = await Promise.all([
      supabase.from('clubs').select('owner_id').eq('id', poll.club_id).maybeSingle(),
      supabase.from('date_poll_options').select('id,starts_at').eq('poll_id', id).order('starts_at'),
    ]);
    const ids = (options.data ?? []).map((o: any) => o.id);
    const votes = ids.length
      ? await supabase.from('date_poll_votes').select('option_id,user_id,profiles:user_id(display_name)').in('option_id', ids)
      : { data: [] as any[] };
    return {
      poll: poll as { id: string; club_id: string; title: string; status: 'open' | 'closed'; closes_at: string | null; created_by: string; meeting_id: string | null },
      ownerId: club.data?.owner_id as string | undefined,
      options: (options.data ?? []) as Option[],
      votes: (votes.data ?? []) as unknown as PollVote[],
    };
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title={t('common.notFound')} />;

  const { poll, options, votes } = data;
  const canManage = poll.created_by === user!.id || data.ownerId === user!.id;
  const isOwner = data.ownerId === user!.id;
  const open = poll.status === 'open';
  const maxVotes = Math.max(0, ...options.map((o) => votes.filter((v) => v.option_id === o.id).length));

  const toggle = async (o: Option) => {
    const mine = votes.some((v) => v.option_id === o.id && v.user_id === user!.id);
    const { error } = mine
      ? await supabase.from('date_poll_votes').delete().eq('option_id', o.id).eq('user_id', user!.id)
      : await supabase.from('date_poll_votes').insert({ option_id: o.id, user_id: user!.id });
    if (error) Alert.alert(t('common.error'), error.message);
    else reload();
  };

  const remove = () =>
    Alert.alert(t('poll.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('poll.delete'),
        style: 'destructive',
        onPress: async () => {
          await supabase.from('date_polls').delete().eq('id', id);
          router.back();
        },
      },
    ]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: t('poll.title') }} />
      <AppText variant="title">{poll.title}</AppText>
      {open ? <AppText muted>{t('poll.voteHint')}</AppText> : <Badge label={t('poll.closed')} />}

      {options.map((o) => {
        const ov = votes.filter((v) => v.option_id === o.id);
        const mine = ov.some((v) => v.user_id === user!.id);
        const leading = open && ov.length > 0 && ov.length === maxVotes;
        return (
          <Card key={o.id} style={mine ? { borderColor: colors.primary, borderWidth: 2 } : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <AppText variant="subheading" style={{ flex: 1 }}>
                {fmtDateTime(o.starts_at)}
              </AppText>
              {leading ? <Badge label={t('poll.leading')} color={colors.success} /> : null}
              <AppText variant="heading">{ov.length}</AppText>
            </Row>
            {ov.length ? (
              <Row gap={4} style={{ flexWrap: 'wrap' }}>
                {ov.map((v) => (
                  <Avatar key={v.user_id} name={v.profiles?.display_name ?? '?'} size={24} />
                ))}
              </Row>
            ) : null}
            {open ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  small
                  style={{ flex: 1 }}
                  variant={mine ? 'primary' : 'secondary'}
                  icon={mine ? 'checkmark-circle' : 'ellipse-outline'}
                  title={mine ? t('poll.available') : t('poll.canCome')}
                  onPress={() => toggle(o)}
                />
                {isOwner ? (
                  <Button
                    small
                    variant="ghost"
                    title={t('poll.pick')}
                    onPress={() => router.push(`/club/meeting/new?club=${poll.club_id}&pollId=${poll.id}&startsAt=${encodeURIComponent(o.starts_at)}`)}
                  />
                ) : null}
              </View>
            ) : null}
          </Card>
        );
      })}

      {poll.meeting_id ? (
        <Button variant="secondary" icon="calendar-outline" title={t('poll.viewMeeting')} onPress={() => router.push(`/club/meeting/${poll.meeting_id}`)} />
      ) : null}
      {canManage ? <Button variant="ghost" title={t('poll.delete')} onPress={remove} /> : null}
    </Screen>
  );
}
