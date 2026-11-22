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
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  // Password rules, checked live as the user types.
  const rules = [
    { ok: password.length >= 8, label: t('auth.ruleLength') },
    { ok: /[A-Za-z]/.test(password) && /\d/.test(password), label: t('auth.ruleLetterNumber') },
    { ok: password.length > 0 && password === repeat, label: t('auth.ruleMatch') },
  ];
  const valid = rules.every((r) => r.ok);

  const submit = async () => {
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      Alert.alert(t('common.error'), t('auth.passwordWeak'));
      return;
    }
    if (password !== repeat) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'));
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
      <Input
        label={t('auth.repeatPassword')}
        value={repeat}
        onChangeText={setRepeat}
        secureTextEntry
        autoComplete="new-password"
        error={repeat.length > 0 && password !== repeat ? t('auth.passwordMismatch') : null}
      />
      <View style={{ gap: 4 }}>
        {rules.map((r) => (
          <AppText key={r.label} variant="caption" style={{ color: r.ok ? colors.success : colors.textMuted }}>
            {r.ok ? '✓' : '○'} {r.label}
          </AppText>
        ))}
      </View>
      <Button title={t('auth.register')} onPress={submit} loading={busy} disabled={!name.trim() || !email || !valid} />

      <SocialAuth mode="register" />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <AppText muted>{t('auth.haveAccount')}</AppText>
        <AppText onPress={() => router.replace('/(auth)/login')} style={{ color: colors.text, fontWeight: '700', textDecorationLine: 'underline' }}>
          {t('auth.login')}
        </AppText>
      </View>
    </Screen>
  );
}
