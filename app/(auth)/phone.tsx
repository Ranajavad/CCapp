import React, { useState } from 'react';
import { Alert } from 'react-native';
import { AppText, Button, Input, Screen } from '@/components/ui';
import { sendPhoneCode, verifyPhoneCode } from '@/lib/authActions';
import { useT } from '@/lib/i18n';

// Works for both log-in and register: Supabase creates the account on first verification.
export default function PhoneAuth() {
  const { t } = useT();
  const [phone, setPhone] = useState('+47');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const normalized = phone.replace(/[\s-]/g, '');

  const send = async () => {
    setBusy(true);
    try {
      await sendPhoneCode(normalized);
      setSent(true);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      await verifyPhoneCode(normalized, code.trim());
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ gap: 16 }}>
      <AppText variant="title">{t('auth.phoneTitle')}</AppText>
      <AppText muted>{sent ? t('auth.phoneCodeBody', { phone: normalized }) : t('auth.phoneBody')}</AppText>
      {!sent ? (
        <>
          <Input label={t('auth.phoneNumber')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
          <Button title={t('auth.sendCode')} onPress={send} loading={busy} disabled={normalized.length < 8} />
        </>
      ) : (
        <>
          <Input
            label={t('auth.code')}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="sms-otp"
          />
          <Button title={t('auth.verify')} onPress={verify} loading={busy} disabled={code.trim().length < 6} />
          <Button variant="ghost" title={t('auth.resend')} onPress={send} disabled={busy} />
        </>
      )}
    </Screen>
  );
}
