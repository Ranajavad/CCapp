import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { AppText, Button, Input, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function NewClub() {
  const { t } = useT();
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from('clubs')
      .insert({ name: name.trim(), description: description.trim() || null, owner_id: user!.id })
      .select('id')
      .single();
    setBusy(false);
    if (error) Alert.alert(t('common.error'), error.message);
    else router.replace(`/club/${data.id}`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('clubs.create') }} />
      <AppText muted>{t('clubs.createBody')}</AppText>
      <Input label={t('clubs.name')} value={name} onChangeText={setName} maxLength={80} />
      <Input label={t('clubs.description')} value={description} onChangeText={setDescription} multiline />
      <Button title={t('clubs.create')} onPress={create} loading={busy} disabled={!name.trim()} />
    </Screen>
  );
}
