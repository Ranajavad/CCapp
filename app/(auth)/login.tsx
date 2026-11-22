import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SocialAuth } from '@/components/SocialAuth';
import { AppText, Avatar, Button, Card, Input, Logo, Row, Screen } from '@/components/ui';
import { forgetRememberedAccount, getRememberedAccount, RememberedAccount, signInRemembered, signInWithEmail } from '@/lib/authActions';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function Login() {
  const { t } = useT();
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [quick, setQuick] = useState(false);
  const [remembered, setRemembered] = useState<RememberedAccount | null>(null);

  useEffect(() => {
    getRememberedAccount().then(setRemembered);
  }, []);

  const continueAsRemembered = async () => {
    if (!remembered) return;
    setQuick(true);
    try {
      await signInRemembered(remembered);
    } catch (e: any) {
      setRemembered(null);
      Alert.alert(t('common.error'), t('auth.sessionExpired'));
    } finally {
      setQuick(false);
    }
  };

  const useAnother = async () => {
    await forgetRememberedAccount();
    setRemembered(null);
  };

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
        {remembered ? (
          <AppText variant="heading" style={{ textAlign: 'center' }}>
            {t('auth.welcomeBack', { name: remembered.name.split(' ')[0] })}
          </AppText>
        ) : (
          <AppText muted style={{ textAlign: 'center' }}>
            {t('app.tagline')}
          </AppText>
        )}
      </View>

      {remembered ? (
        <View style={{ gap: 14 }}>
          <Card>
            <Row gap={14}>
              <Avatar name={remembered.name} url={remembered.avatar} size={56} />
              <View style={{ flex: 1 }}>
                <AppText variant="heading">{remembered.name}</AppText>
                {remembered.email ? (
                  <AppText variant="caption" muted>
                    {remembered.email}
                  </AppText>
                ) : null}
              </View>
            </Row>
          </Card>
          <Button title={t('auth.continueAs', { name: remembered.name.split(' ')[0] })} loading={quick} onPress={continueAsRemembered} />
          <AppText
            onPress={useAnother}
            style={{ color: colors.text, fontWeight: '700', textDecorationLine: 'underline', textAlign: 'center' }}
          >
            {t('auth.useAnother')}
          </AppText>
        </View>
      ) : (
        <>
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
        style={{ color: colors.text, fontWeight: '700', textDecorationLine: 'underline', alignSelf: 'flex-end' }}
      >
        {t('auth.forgot')}
      </AppText>
      <Button title={t('auth.login')} onPress={submit} loading={busy} disabled={!email || !password} />

      <SocialAuth mode="login" />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <AppText muted>{t('auth.noAccount')}</AppText>
        <AppText onPress={() => router.push('/(auth)/register')} style={{ color: colors.text, fontWeight: '700', textDecorationLine: 'underline' }}>
          {t('auth.register')}
        </AppText>
      </View>
        </>
      )}
    </Screen>
  );
}
