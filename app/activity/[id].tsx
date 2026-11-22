import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { ACTIVITY_SELECT, ActivityCard, ActivityItem } from '@/components/ActivityCard';
import { AppText, Avatar, Button, Card, EmptyState, ErrorState, Input, Loading, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type CommentRow = { id: string; user_id: string; body: string; created_at: string; profiles: { display_name: string; avatar_url?: string | null } | null };

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const { data, loading, error, reload } = useData(async () => {
    const [a, c] = await Promise.all([
      supabase.from('activity').select(ACTIVITY_SELECT).eq('id', id).maybeSingle(),
      supabase
        .from('comments')
        .select('id,user_id,body,created_at,profiles:user_id(display_name,avatar_url)')
        .eq('activity_id', id)
        .order('created_at', { ascending: true }),
    ]);
    if (a.error) throw a.error;
    return { activity: a.data as unknown as ActivityItem | null, comments: (c.data ?? []) as unknown as CommentRow[] };
  }, [id]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  if (!data.activity) return <EmptyState title={t('common.notFound')} />;

  const send = async () => {
    setSending(true);
    const { error } = await supabase.from('comments').insert({ activity_id: id, user_id: user!.id, body: text.trim() });
    setSending(false);
    if (error) Alert.alert(t('common.error'), error.message);
    else {
      setText('');
      reload();
    }
  };

  const remove = async (c: CommentRow) => {
    await supabase.from('comments').delete().eq('id', c.id);
    reload();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('feed.comment') }} />
      <ActivityCard item={data.activity} userId={user!.id} onChanged={reload} detail />
      {data.comments.map((c) => (
        <Card key={c.id}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Avatar name={c.profiles?.display_name ?? '?'} url={c.profiles?.avatar_url} size={30} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                {c.user_id === user!.id ? t('common.you') : c.profiles?.display_name}
                <AppText variant="caption" muted>
                  {'  '}
                  {timeAgo(c.created_at)}
                </AppText>
              </AppText>
              <AppText>{c.body}</AppText>
            </View>
            {c.user_id === user!.id ? (
              <AppText variant="caption" muted onPress={() => remove(c)}>
                {t('common.delete')}
              </AppText>
            ) : null}
          </Row>
        </Card>
      ))}
      <Input value={text} onChangeText={setText} placeholder={t('feed.writeComment')} multiline maxLength={1000} />
      <Button title={t('feed.send')} onPress={send} loading={sending} disabled={!text.trim()} />
    </Screen>
  );
}
