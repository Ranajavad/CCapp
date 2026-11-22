import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { loadInbox } from '@/lib/inbox';
import { fonts, useTheme } from '@/lib/theme';

/** Bell for the Home header. The badge counts friend requests and club news you haven't opened yet. */
export function NotificationBell() {
  const { colors } = useTheme();
  const { signedIn, user } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!signedIn || !user) return;
      loadInbox(user.id)
        .then((i) => setCount(i.unread))
        .catch(() => {});
    }, [signedIn, user?.id]),
  );

  return (
    <Pressable onPress={() => router.push('/notifications')} hitSlop={10} style={{ marginRight: 16 }}>
      <Ionicons name={count ? 'notifications' : 'notifications-outline'} size={26} color={colors.text} />
      {count > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontFamily: fonts.serif, fontWeight: '700' }}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
