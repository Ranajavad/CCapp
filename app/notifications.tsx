import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Avatar, Button, Card, EmptyState, ErrorState, Loading, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import { Inbox, loadInbox, markInboxSeen } from '@/lib/inbox';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

export default function Notifications() {
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await loadInbox(user!.id);
      setInbox(data);
      setError(null);
      // Remember when the list was opened; this visit still shows what was new (dots) from `seenAt`.
      markInboxSeen(data.accepted.map((f) => f.id));
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const act = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await fn();
    if (error) Alert.alert(t('common.error'), error.message);
    else load();
  };

  if (!inbox && !error) return <Loading />;
  if (!inbox) return <ErrorState message={error ?? ''} onRetry={load} />;

  const empty = inbox.requests.length === 0 && inbox.accepted.length === 0 && inbox.items.length === 0;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <Stack.Screen options={{ title: t('notifications.title') }} />

      {inbox.requests.map((r) => (
        <Card key={r.id}>
          <Row>
            <Avatar name={r.requester?.display_name ?? '?'} url={r.requester?.avatar_url} size={44} />
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '600' }}>{t('notifications.friendRequest', { name: r.requester?.display_name ?? '?' })}</AppText>
              <AppText variant="caption" muted>
                {timeAgo(r.created_at)}
              </AppText>
            </View>
          </Row>
          <Row>
            <Button
              small
              style={{ flex: 1 }}
              title={t('friends.accept')}
              onPress={() => act(() => supabase.from('friendships').update({ status: 'accepted' }).eq('id', r.id))}
            />
            <Button
              small
              variant="secondary"
              style={{ flex: 1 }}
              title={t('friends.decline')}
              onPress={() => act(() => supabase.from('friendships').delete().eq('id', r.id))}
            />
          </Row>
        </Card>
      ))}

      {inbox.accepted.map((f) => (
        <Card key={f.id} onPress={() => router.push('/friends')}>
          <Row>
            <Avatar name={f.person?.display_name ?? '?'} url={f.person?.avatar_url} size={40} />
            <AppText style={{ flex: 1, fontWeight: '700' }}>{t('notifications.accepted', { name: f.person?.display_name ?? '?' })}</AppText>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} />
          </Row>
        </Card>
      ))}

      {inbox.items.map((i) => {
        const isNew = i.at > inbox.seenAt;
        return (
          <Card key={i.id} onPress={() => router.push(i.href as any)}>
            <Row>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={i.icon} size={20} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: isNew ? '700' : '500' }}>{t(i.titleKey, i.params)}</AppText>
                <AppText variant="caption" muted>
                  {timeAgo(i.at)}
                </AppText>
              </View>
              {isNew ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} /> : null}
            </Row>
          </Card>
        );
      })}

      {empty ? <EmptyState icon="notifications-outline" title={t('notifications.empty')} body={t('notifications.emptyBody')} /> : null}
    </Screen>
  );
}
