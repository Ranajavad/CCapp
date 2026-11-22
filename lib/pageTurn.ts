import { Animated, Easing, Platform } from 'react-native';
import type { StackCardStyleInterpolator, StackNavigationOptions } from 'expo-router/js-stack';

type StackSpec = NonNullable<StackNavigationOptions['transitionSpec']>['open'];

/**
 * "Turning a page" transitions.
 *
 * Every page is hinged on one vertical edge (like a spine) and swings around it in 3D with
 * perspective. Pushing a screen turns the new page in from the right; going back lifts it away
 * again, so the motion always matches the direction of travel.
 *
 * Only `transform` is animated on the pages themselves, so it runs on the native driver.
 *
 * Pushed screens use the full 3D turn; tabs use a flat version (see createTabPageTurn below).
 */

const PERSPECTIVE = 1400;
const NATIVE = Platform.OS !== 'web';
const easing = Easing.bezier(0.25, 0.8, 0.25, 1);

/** Timing used for opening and closing a page. */
export const pageTurnSpec: StackSpec = {
  animation: 'timing',
  config: { duration: 520, easing, useNativeDriver: NATIVE },
};

/** Stack (screen → screen) interpolator. Pivots on the right edge of the incoming page. */
export const forPageTurn: StackCardStyleInterpolator = ({ current, next, layouts }) => {
  const w = layouts.screen.width || 1;

  // 0 = page not yet turned in, 1 = lying flat, 2 = covered by the next page.
  const progress = Animated.add(
    current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    next ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }) : 0,
  );

  const rotateY = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['88deg', '0deg', '0deg'],
    extrapolate: 'clamp',
  });
  // The page we leave behind slides a little to the left and settles back, as pages in a stack do.
  const slide = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 0, -w * 0.28],
    extrapolate: 'clamp',
  });
  const scale = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 1, 0.96],
    extrapolate: 'clamp',
  });
  // Dim the page underneath while another one turns over it (the shadow cast by the turning page).
  const overlayOpacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.38],
    extrapolate: 'clamp',
  });
  const shadowOpacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.35, 0],
    extrapolate: 'clamp',
  });

  return {
    cardStyle: {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: slide },
        { scale },
        // Rotate around the right edge: move the hinge to the origin, rotate, move it back.
        { translateX: w / 2 },
        { rotateY },
        { translateX: -w / 2 },
      ],
    },
    overlayStyle: { opacity: overlayOpacity },
    shadowStyle: { shadowOpacity, shadowRadius: 18, shadowOffset: { width: -6, height: 0 }, shadowColor: '#000' },
  };
};

/**
 * Tab (tab → tab) interpolator. The scene's progress is -1 (left of the active tab), 0 (active)
 * or 1 (right of it). Scenes on the right hinge on their right edge and swing in; scenes on the
 * left hinge on their left edge and lift away like a page being turned over.
 *
 * Unlike the stack turn this uses only flat (2D) transforms: the page is squeezed horizontally
 * around its hinge, the way a page looks while it turns. A 3D perspective transform left iPhone
 * pages drawn through a slower 3D path, soft until touched, even at rest; flat transforms are
 * exact at rest, so nothing needs resetting afterwards.
 */
export function createTabPageTurn(width: number) {
  const w = width || 400;
  return (progress: Animated.Value) => {
    // cos(angle) for a page turned 0°, 22°, 44°, 66° and 88° away from flat.
    const scaleX = progress.interpolate({
      inputRange: [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      outputRange: [0.035, 0.407, 0.719, 0.927, 1, 0.927, 0.719, 0.407, 0.035],
      extrapolate: 'clamp',
    });
    // Move the hinge edge to the origin, squeeze, move it back.
    const pre = progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [w / 2, 0, -w / 2], extrapolate: 'clamp' });
    const post = progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [-w / 2, 0, w / 2], extrapolate: 'clamp' });
    return {
      sceneStyle: {
        transform: [{ translateX: post }, { scaleX }, { translateX: pre }],
      },
    };
  };
}

export const tabPageTurnSpec = {
  animation: 'timing' as const,
  config: { duration: 460, easing, useNativeDriver: NATIVE },
};
