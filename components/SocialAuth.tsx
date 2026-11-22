import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { isAppleAvailable, signInWithApple, signInWithGoogle } from '@/lib/authActions';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { AppText, Button, Divider, Row } from './ui';

/** Apple (iPhone only) and Google – the same buttons on the log-in and register screens. */
export function SocialAuth({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useT();
  const { scheme } = useTheme();
  const [apple, setApple] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    isAppleAvailable().then(setApple);
  }, []);

  const runGoogle = async () => {
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
    } finally {
      setGoogleBusy(false);
    }
  };

  const run = async () => {
    try {
      await signInWithApple();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? String(e));
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
          onPress={run}
        />
      ) : null}

      <Button variant="secondary" icon="logo-google" title={t('auth.google')} loading={googleBusy} onPress={runGoogle} />
    </View>
  );
}
