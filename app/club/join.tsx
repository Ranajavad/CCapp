import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { AppText, Button, Input, Screen } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function JoinClub() {
  const { t } = useT();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const join = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('join_club_by_code', { p_code: code });
    setBusy(false);
    if (error) {
      Alert.alert(t('common.error'), error.message.includes('invalid_code') ? t('clubs.invalidCode') : error.message);
    } else {
      router.replace(`/club/${data}`);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('clubs.join') }} />
      <AppText muted>{t('clubs.joinBody')}</AppText>
      <Input
        label={t('clubs.code')}
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        style={{ fontSize: 24, letterSpacing: 6, textAlign: 'center' }}
      />
      <Button title={t('clubs.join')} onPress={join} loading={busy} disabled={code.trim().length < 6} />
    </Screen>
  );
}
