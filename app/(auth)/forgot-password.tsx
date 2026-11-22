import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { AppText, Button, Input, Screen } from '@/components/ui';
import { resetPasswordWithCode, sendPasswordResetCode } from '@/lib/authActions';
import { useT } from '@/lib/i18n';

// Step 1: e-mail a 6-digit code. Step 2: enter code + new password.
// (Requires the Supabase "Reset password" e-mail template to include {{ .Token }} – see README.)
export default function ForgotPassword() {
  const { t } = useT();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await sendPasswordResetCode(email);
      setSent(true);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordShort'));
      return;
    }
    setBusy(true);
    try {
      await resetPasswordWithCode(email, code, password);
      Alert.alert(t('auth.passwordUpdated'));
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ gap: 16 }}>
      <AppText variant="title">{t('auth.forgotTitle')}</AppText>
      <AppText muted>{sent ? t('auth.forgotCodeBody', { email }) : t('auth.forgotBody')}</AppText>
      <Input
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!sent}
      />
      {!sent ? (
        <Button title={t('auth.sendCode')} onPress={send} loading={busy} disabled={!email} />
      ) : (
        <>
          <Input label={t('auth.code')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
          <Input label={t('auth.newPassword')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
          <Button title={t('auth.resetPassword')} onPress={reset} loading={busy} disabled={code.trim().length < 6 || !password} />
          <Button variant="ghost" title={t('auth.resend')} onPress={send} disabled={busy} />
        </>
      )}
    </Screen>
  );
}
