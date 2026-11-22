import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { SocialAuth } from '@/components/SocialAuth';
import { AppText, Button, Input, Logo, Screen } from '@/components/ui';
import { signInWithEmail } from '@/lib/authActions';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function Login() {
  const { t } = useT();
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await signInWithEmail(email, password);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ paddingTop: 72, gap: 18 }}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Logo size={84} />
        <AppText variant="title">Chapters & Chatters</AppText>
        <AppText muted style={{ textAlign: 'center' }}>
          {t('app.tagline')}
        </AppText>
      </View>

      <Input
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <AppText
        variant="caption"
        onPress={() => router.push('/(auth)/forgot-password')}
        style={{ color: colors.primary, fontWeight: '700', alignSelf: 'flex-end' }}
      >
        {t('auth.forgot')}
      </AppText>
      <Button title={t('auth.login')} onPress={submit} loading={busy} disabled={!email || !password} />

      <SocialAuth mode="login" />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <AppText muted>{t('auth.noAccount')}</AppText>
        <AppText onPress={() => router.push('/(auth)/register')} style={{ color: colors.primary, fontWeight: '700' }}>
          {t('auth.register')}
        </AppText>
      </View>
    </Screen>
  );
}
