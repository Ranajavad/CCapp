import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { DateTimeField } from '@/components/DateTimeField';
import { AppText, Button, Card, Input, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

export default function NewPoll() {
  const { club } = useLocalSearchParams<{ club: string }>();
  const { t } = useT();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<Date[]>([]);
  const [next, setNext] = useState(new Date(Date.now() + 7 * 86400000));
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from('date_polls')
      .insert({ club_id: club, title: title.trim() || t('poll.defaultTitle'), created_by: user!.id })
      .select('id')
      .single();
    if (error) {
      setBusy(false);
      Alert.alert(t('common.error'), error.message);
      return;
    }
    const { error: e2 } = await supabase
      .from('date_poll_options')
      .insert(options.map((d) => ({ poll_id: data.id, starts_at: d.toISOString() })));
    setBusy(false);
    if (e2) Alert.alert(t('common.error'), e2.message);
    else router.replace(`/club/poll/${data.id}`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('poll.suggest') }} />
      <AppText muted>{t('poll.intro')}</AppText>
      <Input label={t('poll.title')} value={title} onChangeText={setTitle} placeholder={t('poll.defaultTitle')} />

      {options.map((d, i) => (
        <Card key={d.toISOString()}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText>{fmtDateTime(d)}</AppText>
            <Pressable onPress={() => setOptions(options.filter((_, j) => j !== i))} hitSlop={10}>
              <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </Pressable>
          </Row>
        </Card>
      ))}

      <DateTimeField label={t('poll.addOption')} value={next} onChange={setNext} minimumDate={new Date()} />
      <Button
        small
        variant="secondary"
        icon="add"
        title={t('poll.addDate')}
        onPress={() => setOptions([...options, next].sort((a, b) => a.getTime() - b.getTime()))}
      />
      <Button title={t('poll.create')} onPress={create} loading={busy} disabled={options.length < 2} />
      {options.length < 2 ? (
        <AppText variant="caption" muted>
          {t('poll.minTwo')}
        </AppText>
      ) : null}
    </Screen>
  );
}
