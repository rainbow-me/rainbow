import { memo, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View, Image } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'react-native-blur-view';
import rnbwCoin from '@/assets/rnbw.png';
import { time } from '@/utils/time';
import { ClaimSteps, useRnbwClaimContext } from '@/features/rnbw-rewards/context/RnbwClaimContext';

// Original design dimensions
const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

const FLOAT_EASING = Easing.inOut(Easing.ease);
const EXIT_EASING = Easing.bezier(0.2, 0.9, 0.2, 1);
const EXIT_DURATION = time.seconds(1);

const FLOAT_PATTERNS = {
  a: { x: 16, y: -18 },
  b: { x: -18, y: 15 },
  c: { x: 14, y: 18 },
  d: { x: -16, y: -16 },
};

// TODO: calculate from coin's position helpers
const CLAIMED_POSITION = {
  leftPercent: 176 / DESIGN_WIDTH,
  topPercent: 144 / DESIGN_HEIGHT,
};

type CoinConfig = {
  leftPercent: number;
  topPercent: number;
  size: number;
  opacity: number;
  blur: number;
  pattern: keyof typeof FLOAT_PATTERNS;
  duration: number;
  reverse?: boolean;
  exitX: number;
  exitY: number;
};

const COINS: CoinConfig[] = [
  {
    leftPercent: -67 / DESIGN_WIDTH,
    topPercent: 388 / DESIGN_HEIGHT,
    size: 108,
    opacity: 0.8,
    blur: 2,
    pattern: 'a',
    duration: time.seconds(22),
    reverse: true,
    exitX: -16,
    exitY: 8,
  },
  {
    leftPercent: -30 / DESIGN_WIDTH,
    topPercent: 236 / DESIGN_HEIGHT,
    size: 66,
    opacity: 0.8,
    blur: 1,
    pattern: 'c',
    duration: time.seconds(16),
    exitX: -24,
    exitY: 8,
  },
  {
    leftPercent: 63 / DESIGN_WIDTH,
    topPercent: -30 / DESIGN_HEIGHT,
    size: 86,
    opacity: 0.8,
    blur: 2,
    pattern: 'a',
    duration: time.seconds(14),
    exitX: -16,
    exitY: -18,
  },
  {
    leftPercent: 348 / DESIGN_WIDTH,
    topPercent: 126 / DESIGN_HEIGHT,
    size: 74,
    opacity: 0.9,
    blur: 1.5,
    pattern: 'b',
    duration: time.seconds(18),
    exitX: 32,
    exitY: -8,
  },
  {
    leftPercent: 300 / DESIGN_WIDTH,
    topPercent: 271 / DESIGN_HEIGHT,
    size: 42,
    opacity: 1,
    blur: 1,
    pattern: 'd',
    duration: time.seconds(20),
    exitX: 24,
    exitY: 20,
  },
  {
    leftPercent: 333 / DESIGN_WIDTH,
    topPercent: 408 / DESIGN_HEIGHT,
    size: 90,
    opacity: 0.7,
    blur: 2,
    pattern: 'b',
    duration: time.seconds(15),
    reverse: true,
    exitX: 26,
    exitY: 12,
  },
];

export type FloatingCoinsState = 'visible' | 'hidden' | 'claimed';

function FloatingCoin({ config, state }: { config: CoinConfig; state: FloatingCoinsState }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const exitProgress = useSharedValue(0);

  const size = config.size;
  const left = screenWidth * config.leftPercent;
  const top = screenHeight * config.topPercent;

  const scaleX = screenWidth / DESIGN_WIDTH;
  const scaleY = screenHeight / DESIGN_HEIGHT;

  const claimedLeft = screenWidth * CLAIMED_POSITION.leftPercent;
  const claimedTop = screenHeight * CLAIMED_POSITION.topPercent;

  const startFloatingAnimation = useCallback(() => {
    'worklet';
    const pattern = FLOAT_PATTERNS[config.pattern];
    const x = config.reverse ? -pattern.x : pattern.x;
    const y = config.reverse ? -pattern.y : pattern.y;

    const timingConfig = { duration: config.duration / 2, easing: FLOAT_EASING };

    translateX.value = withRepeat(withSequence(withTiming(x, timingConfig), withTiming(0, timingConfig)), -1);
    translateY.value = withRepeat(withSequence(withTiming(y, timingConfig), withTiming(0, timingConfig)), -1);
  }, [config.pattern, config.reverse, translateX, translateY, config.duration]);

  useAnimatedReaction(
    () => {
      return state;
    },
    current => {
      exitProgress.value = withTiming(current === 'visible' ? 0 : 1, {
        duration: EXIT_DURATION,
        easing: EXIT_EASING,
      });
    },
    [state, exitProgress]
  );

  useEffect(() => {
    runOnUI(() => {
      startFloatingAnimation();
    })();
  }, [startFloatingAnimation]);

  const containerStyle = useAnimatedStyle(() => {
    if (state === 'claimed') {
      return {
        left: interpolate(exitProgress.value, [0, 1], [left, claimedLeft]),
        top: interpolate(exitProgress.value, [0, 1], [top, claimedTop]),
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
      };
    }

    return {
      left,
      top,
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    };
  });

  const innerStyle = useAnimatedStyle(() => {
    if (state === 'claimed') {
      return {
        opacity: interpolate(exitProgress.value, [0, 1], [config.opacity, 0]),
        transform: [{ scale: interpolate(exitProgress.value, [0, 1], [1, 0.6]) }],
      };
    }

    // Hidden state - fly outward
    const exitXFinal = config.exitX * 3 * scaleX;
    const exitYFinal = config.exitY * 3 * scaleY;

    return {
      opacity: interpolate(exitProgress.value, [0, 1], [config.opacity, 0]),
      transform: [
        { translateX: interpolate(exitProgress.value, [0, 1], [0, exitXFinal]) },
        { translateY: interpolate(exitProgress.value, [0, 1], [0, exitYFinal]) },
        { scale: interpolate(exitProgress.value, [0, 1], [1, 0.55]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.coinContainer,
        {
          width: size,
          height: size,
        },
        containerStyle,
      ]}
    >
      <Animated.View style={[styles.coinInner, innerStyle]}>
        <View style={styles.blurWrapper}>
          <Image source={rnbwCoin} style={{ width: size, height: size }} />
          <BlurView style={StyleSheet.absoluteFill} blurStyle="plain" blurIntensity={config.blur} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export const FloatingCoins = memo(function FloatingCoins() {
  const { activeStepState } = useRnbwClaimContext();
  const state = useMemo(() => {
    switch (activeStepState) {
      case ClaimSteps.Introduction:
      case ClaimSteps.Claim:
        return 'visible';
      case ClaimSteps.CheckingAirdrop:
        return 'hidden';
      default:
        return 'hidden';
    }
  }, [activeStepState]);
  return (
    <View style={styles.container} pointerEvents="none">
      {COINS.map((config, index) => (
        <FloatingCoin key={index} config={config} state={state} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  coinContainer: {
    position: 'absolute',
  },
  coinInner: {
    flex: 1,
  },
  blurWrapper: {
    flex: 1,
    borderRadius: 9999,
    overflow: 'hidden',
  },
});
