import { useRouter, useSegments } from 'expo-router';
import { CardStyleInterpolators, Stack } from 'expo-router/js-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IntroSplash } from '@/components/IntroSplash';
import { AppText, Loading, Logo } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { applyLanguagePref, loadLanguagePref, useT } from '@/lib/i18n';
import { SKIP_LOGIN } from '@/lib/devMode';
import { isSupabaseConfigured } from '@/lib/supabase';
import { forPageTurn, pageTurnSpec } from '@/lib/pageTurn';
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
          cardStyle: { backgroundColor: colors.bg },
          // Pages turn like the pages of a book (see lib/pageTurn.ts).
          headerMode: 'screen',
          animation: 'default',
          gestureEnabled: false,
          cardOverlayEnabled: true,
          cardShadowEnabled: true,
          cardStyleInterpolator: forPageTurn,
          transitionSpec: { open: pageTurnSpec, close: pageTurnSpec },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-book"
          options={{
            title: t('library.addBook'),
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            transitionSpec: undefined,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // Full-screen logo intro, shown once per app launch on top of the app while it loads underneath.
  const [intro, setIntro] = useState(true);
  const endIntro = useCallback(() => setIntro(false), []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <View style={{ flex: 1 }}>
            <Gate />
            {intro && <IntroSplash onDone={endIntro} />}
          </View>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
