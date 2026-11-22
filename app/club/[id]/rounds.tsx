import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { DateTimeField } from '@/components/DateTimeField';
import { AppText, Badge, Button, Card, EmptyState, ErrorState, Input, Loading, Row, Screen, Section } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Round, roundPhase } from '@/lib/types';

const inDays = (n: number) => new Date(Date.now() + n * 86400000);

export default function Rounds() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [nomEnd, setNomEnd] = useState(inDays(7));
  const [voteEnd, setVoteEnd] = useState(inDays(14));
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload, refreshing, refresh } = useData(async () => {
    await supabase.rpc('close_due_rounds');
    const [club, rounds] = await Promise.all([
      supabase.from('clubs').select('owner_id').eq('id', id).maybeSingle(),
      supabase.from('club_rounds').select('*').eq('club_id', id).order('created_at', { ascending: false }),
    ]);
    if (rounds.error) throw rounds.error;
    return { ownerId: club.data?.owner_id as string | undefined, rounds: (rounds.data ?? []) as Round[] };
  }, [id]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const isOwner = data.ownerId === user!.id;

  const create = async () => {
    if (voteEnd <= nomEnd) {
      Alert.alert(t('common.error'), t('rounds.deadlineOrder'));
      return;
    }
    setBusy(true);
    const { data: row, error } = await supabase
      .from('club_rounds')
      .insert({
        club_id: id,
        title: title.trim() || t('rounds.defaultTitle'),
        nominations_deadline: nomEnd.toISOString(),
        voting_deadline: voteEnd.toISOString(),
        anonymous,
        created_by: user!.id,
      })
      .select('id')
      .single();
    setBusy(false);
    if (error) Alert.alert(t('common.error'), error.message);
    else {
      setCreating(false);
      setTitle('');
      router.push(`/club/round/${row.id}`);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: t('club.voting') }} />
      <AppText muted>{t('rounds.intro')}</AppText>

      {isOwner ? (
        creating ? (
          <Card>
            <AppText variant="subheading">{t('rounds.new')}</AppText>
            <Input label={t('rounds.title')} value={title} onChangeText={setTitle} placeholder={t('rounds.defaultTitle')} />
            <DateTimeField label={t('rounds.nomDeadline')} value={nomEnd} onChange={setNomEnd} minimumDate={new Date()} />
            <DateTimeField label={t('rounds.voteDeadline')} value={voteEnd} onChange={setVoteEnd} minimumDate={nomEnd} />
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading">{t('rounds.anonymous')}</AppText>
                <AppText variant="caption" muted>
                  {t('rounds.anonymousHint')}
                </AppText>
              </View>
              <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ true: colors.primary }} />
            </Row>
            <Row>
              <Button style={{ flex: 1 }} title={t('rounds.start')} onPress={create} loading={busy} />
              <Button variant="ghost" title={t('common.cancel')} onPress={() => setCreating(false)} />
            </Row>
          </Card>
        ) : (
          <Button icon="add-circle-outline" title={t('rounds.new')} onPress={() => setCreating(true)} />
        )
      ) : (
        <AppText variant="caption" muted>
          {t('rounds.ownerOnly')}
        </AppText>
      )}

      <Section title={t('rounds.all')}>
        {data.rounds.length === 0 ? <EmptyState icon="trophy-outline" title={t('rounds.empty')} /> : null}
        {data.rounds.map((r) => {
          const phase = roundPhase(r);
          return (
            <Card key={r.id} onPress={() => router.push(`/club/round/${r.id}`)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText variant="subheading" style={{ flex: 1 }}>
                  {r.title}
                </AppText>
                <Badge label={t(`phase.${phase}` as any)} color={phase === 'closed' ? colors.textMuted : colors.primary} />
              </Row>
              <AppText variant="caption" muted>
                {phase === 'nominating'
                  ? t('rounds.nomUntil', { date: fmtDateTime(r.nominations_deadline) })
                  : phase === 'voting'
                    ? t('rounds.voteUntil', { date: fmtDateTime(r.voting_deadline) })
                    : t('rounds.closedOn', { date: fmtDateTime(r.voting_deadline) })}
                {r.anonymous ? ` · ${t('rounds.anonymousShort')}` : ''}
              </AppText>
            </Card>
          );
        })}
      </Section>
    </Screen>
  );
}
