import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { SocialAuth } from '@/components/SocialAuth';
import { AppText, Button, Input, Screen } from '@/components/ui';
import { signUpWithEmail } from '@/lib/authActions';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function Register() {
  const { t } = useT();
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordShort'));
      return;
    }
    setBusy(true);
    try {
      const signedIn = await signUpWithEmail(name, email, password);
      if (!signedIn) setConfirmSent(true);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  if (confirmSent) {
    return (
      <Screen style={{ paddingTop: 40, gap: 14 }}>
        <AppText variant="title">{t('auth.checkEmail')}</AppText>
        <AppText muted>{t('auth.checkEmailBody', { email })}</AppText>
        <Button title={t('auth.login')} onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: 16 }}>
      <AppText variant="title">{t('auth.createAccount')}</AppText>
      <AppText muted>{t('auth.createAccountBody')}</AppText>
      <Input label={t('auth.name')} value={name} onChangeText={setName} autoComplete="name" />
      <Input
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Input
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />
      <AppText variant="caption" muted>
        {t('auth.passwordHint')}
      </AppText>
      <Button title={t('auth.register')} onPress={submit} loading={busy} disabled={!name.trim() || !email || !password} />

      <SocialAuth mode="register" />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <AppText muted>{t('auth.haveAccount')}</AppText>
        <AppText onPress={() => router.replace('/(auth)/login')} style={{ color: colors.primary, fontWeight: '700' }}>
          {t('auth.login')}
        </AppText>
      </View>
    </Screen>
  );
}
