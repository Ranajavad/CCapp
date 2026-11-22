import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { brand, Logo } from '@/components/ui';
import { fonts } from '@/lib/theme';

const HOLD_MS = 1600;

/**
 * Full-screen intro shown once when the app opens: the logo and the app name on olive,
 * then it fades away. It continues straight from the native splash screen (same olive
 * background and logo) so the hand-over is seamless.
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const logoIn = useRef(new Animated.Value(0)).current;
  const nameIn = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.timing(logoIn, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(nameIn, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(HOLD_MS - 950),
      Animated.timing(out, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => anim.stop();
  }, [logoIn, nameIn, out, onDone]);

  return (
    <Animated.View pointerEvents="auto" style={[styles.fill, { opacity: out }]}>
      <Animated.View style={{ opacity: logoIn, transform: [{ scale: logoIn.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
        <Logo size={200} bare />
      </Animated.View>
      <Animated.View
        style={{ opacity: nameIn, transform: [{ translateY: nameIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}
      >
        <Text style={styles.name}>
          Chapters <Text style={styles.amp}>&amp;</Text> Chatters
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: brand.olive,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 100,
  },
  name: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 34, color: brand.cream, letterSpacing: 0.3 },
  amp: { fontStyle: 'italic', color: brand.cream },
});
