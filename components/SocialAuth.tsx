import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { isAppleAvailable, signInWithApple, signInWithGoogle } from '@/lib/authActions';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { AppText, Button, Divider, Row } from './ui';

/** Apple / Google / phone options – the same buttons on the log-in and register screens. */
export function SocialAuth({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useT();
  const { scheme } = useTheme();
  const router = useRouter();
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  useEffect(() => {
    isAppleAvailable().then(setApple);
  }, []);

  const run = async (kind: 'google' | 'apple', fn: () => Promise<boolean>) => {
    setBusy(kind);
    try {
      await fn();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <Divider />
        </View>
        <AppText variant="caption" muted>
          {t('auth.or')}
        </AppText>
        <View style={{ flex: 1 }}>
          <Divider />
        </View>
      </Row>

      {apple ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={
            mode === 'login'
              ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
          }
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={999}
          style={{ height: 46 }}
          onPress={() => run('apple', signInWithApple)}
        />
      ) : null}

      <Button
        variant="secondary"
        icon="logo-google"
        title={t('auth.google')}
        loading={busy === 'google'}
        onPress={() => run('google', signInWithGoogle)}
      />
      <Button variant="secondary" icon="call-outline" title={t('auth.phone')} onPress={() => router.push('/(auth)/phone')} />
    </View>
  );
}
