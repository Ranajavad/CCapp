import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Avatar, Button, Card, Input, Row, Screen, Section } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/hooks';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  requester: { id: string; display_name: string } | null;
  addressee: { id: string; display_name: string } | null;
};

export default function Friends() {
  const { t } = useT();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [found, setFound] = useState<{ id: string; display_name: string }[] | null>(null);

  const { data, reload } = useData(async () => {
    const { data, error } = await supabase
      .from('friendships')
      .select('id,requester_id,addressee_id,status,requester:requester_id(id,display_name),addressee:addressee_id(id,display_name)');
    if (error) throw error;
    return (data ?? []) as unknown as Friendship[];
  }, [user?.id]);

  const all = data ?? [];
  const incoming = all.filter((f) => f.status === 'pending' && f.addressee_id === user!.id);
  const outgoing = all.filter((f) => f.status === 'pending' && f.requester_id === user!.id);
  const friends = all.filter((f) => f.status === 'accepted');
  const knownIds = new Set(all.flatMap((f) => [f.requester_id, f.addressee_id]));

  const search = async () => {
    const term = q.trim();
    if (term.length < 2) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id,display_name')
      .ilike('display_name', `%${term.replace(/[%_]/g, '')}%`)
      .neq('id', user!.id)
      .limit(20);
    if (error) Alert.alert(t('common.error'), error.message);
    else setFound(data ?? []);
  };

  const act = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await fn();
    if (error) Alert.alert(t('common.error'), error.message);
    else reload();
  };

  const other = (f: Friendship) => (f.requester_id === user!.id ? f.addressee : f.requester);

  return (
    <Screen>
      <Stack.Screen options={{ title: t('friends.title') }} />
      <Row>
        <View style={{ flex: 1 }}>
          <Input value={q} onChangeText={setQ} placeholder={t('friends.search')} onSubmitEditing={search} returnKeyType="search" />
        </View>
        <Button small title={t('common.search')} onPress={search} />
      </Row>

      {found ? (
        <Section title={t('friends.results')}>
          {found.length === 0 ? <AppText muted>{t('friends.noResults')}</AppText> : null}
          {found.map((p) => (
            <Card key={p.id}>
              <Row>
                <Avatar name={p.display_name} />
                <AppText style={{ flex: 1 }}>{p.display_name}</AppText>
                {knownIds.has(p.id) ? (
                  <AppText variant="caption" muted>
                    {t('friends.requested')}
                  </AppText>
                ) : (
                  <Button
                    small
                    title={t('friends.add')}
                    onPress={() => act(() => supabase.from('friendships').insert({ requester_id: user!.id, addressee_id: p.id }))}
                  />
                )}
              </Row>
            </Card>
          ))}
        </Section>
      ) : null}

      {incoming.length ? (
        <Section title={t('friends.requests')}>
          {incoming.map((f) => (
            <Card key={f.id}>
              <Row>
                <Avatar name={f.requester?.display_name ?? '?'} />
                <AppText style={{ flex: 1 }}>{f.requester?.display_name}</AppText>
                <Button small title={t('friends.accept')} onPress={() => act(() => supabase.from('friendships').update({ status: 'accepted' }).eq('id', f.id))} />
                <Button small variant="ghost" title={t('friends.decline')} onPress={() => act(() => supabase.from('friendships').delete().eq('id', f.id))} />
              </Row>
            </Card>
          ))}
        </Section>
      ) : null}

      <Section title={t('friends.mine')}>
        {friends.length === 0 ? <AppText muted>{t('friends.none')}</AppText> : null}
        {friends.map((f) => (
          <Card key={f.id}>
            <Row>
              <Avatar name={other(f)?.display_name ?? '?'} />
              <AppText style={{ flex: 1 }}>{other(f)?.display_name}</AppText>
              <AppText variant="caption" muted onPress={() => act(() => supabase.from('friendships').delete().eq('id', f.id))}>
                {t('friends.remove')}
              </AppText>
            </Row>
          </Card>
        ))}
        {outgoing.map((f) => (
          <AppText key={f.id} variant="caption" muted>
            {t('friends.pendingWith', { name: f.addressee?.display_name ?? '' })}
          </AppText>
        ))}
      </Section>
    </Screen>
  );
}
