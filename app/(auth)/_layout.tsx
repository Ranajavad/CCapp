import { Stack } from 'expo-router';
import React from 'react';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function AuthLayout() {
  const { colors } = useTheme();
  const { t } = useT();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: '' }} />
      <Stack.Screen name="phone" options={{ title: t('auth.phoneTitle') }} />
      <Stack.Screen name="forgot-password" options={{ title: t('auth.forgotTitle') }} />
    </Stack>
  );
}
