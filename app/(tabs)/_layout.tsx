import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import type { ColorValue } from 'react-native';
import { Logo } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { createTabPageTurn, tabPageTurnSpec } from '@/lib/pageTurn';
import { fonts, useTheme } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabsLayout() {
  const { t } = useT();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const sceneStyleInterpolator = useMemo(() => {
    const turn = createTabPageTurn(width);
    return ({ current }: { current: { progress: any } }) => turn(current.progress);
  }, [width]);

  const icon = (active: IconName, inactive: IconName) =>
    function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
      return <Ionicons name={focused ? active : inactive} size={size} color={color as string} />;
    };

  return (
    <Tabs
      screenOptions={{
        // Switching tabs turns the page (flat version, see lib/pageTurn.ts).
        sceneStyleInterpolator,
        transitionSpec: tabPageTurnSpec,
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.serif, fontWeight: '700', color: colors.text },
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          // Home shows the brand in the header: logo + app name.
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Logo size={32} />
              <Text style={{ fontFamily: fonts.serif, fontWeight: '700', fontSize: 19, color: colors.text }}>Chapters & Chatters</Text>
            </View>
          ),
          tabBarIcon: icon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen name="library" options={{ title: t('tabs.library'), tabBarIcon: icon('library', 'library-outline') }} />
      <Tabs.Screen name="discover" options={{ title: t('tabs.discover'), tabBarIcon: icon('compass', 'compass-outline') }} />
      <Tabs.Screen name="clubs" options={{ title: t('tabs.clubs'), tabBarIcon: icon('people', 'people-outline') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: icon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}
