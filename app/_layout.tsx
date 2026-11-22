import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppText, Loading, Logo } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { applyLanguagePref, loadLanguagePref, useT } from '@/lib/i18n';
import { SKIP_LOGIN } from '@/lib/devMode';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';

function Gate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useT();
  const { colors, scheme } = useTheme();

  useEffect(() => {
    loadLanguagePref().then(applyLanguagePref);
  }, []);

  useEffect(() => {
    if (loading || !(isSupabaseConfigured || SKIP_LOGIN)) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    else if (user && inAuth) router.replace('/(tabs)');
  }, [user, loading, segments, router]);

  if (!isSupabaseConfigured && !SKIP_LOGIN) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 }}>
        <Logo size={72} />
        <AppText variant="heading">{t('setup.title')}</AppText>
        <AppText muted style={{ textAlign: 'center' }}>
          {t('setup.body')}
        </AppText>
      </View>
    );
  }

  if (loading) return <Loading />;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="add-book" options={{ presentation: 'modal', title: t('library.addBook') }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
