import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View, Image } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'react-native-blur-view';
import rnbwCoin from '@/assets/rnbw.png';
import { time } from '@/utils/time';
import { ClaimSteps, useRnbwAirdropContext } from '@/features/rnbw-rewards/context/RnbwAirdropContext';
import { getCoinCenterPosition } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/RnbwCoin';

// Original design dimensions
const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

const FLOAT_EASING = Easing.inOut(Easing.ease);
const EXIT_EASING = Easing.bezier(0.2, 0.9, 0.2, 1);
const EXIT_DURATION = time.seconds(1);

const CLAIMED_CENTER = getCoinCenterPosition(ClaimSteps.NothingToClaim);

const FLOAT_PATTERNS = {
  a: { x: 16, y: -18 },
  b: { x: -18, y: 15 },
  c: { x: 14, y: 18 },
  d: { x: -16, y: -16 },
};

type CoinConfig = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  blur: number;
  pattern: keyof typeof FLOAT_PATTERNS;
  duration: number;
  // The x and y translations that the coin animates off screen to
  exitX: number;
  exitY: number;
  // Flips the sign of the x and y values of the pattern
  reverse?: boolean;
};

const COINS: CoinConfig[] = [
  {
    left: -67,
    top: 388,
    size: 108,
    opacity: 0.8,
    blur: 2,
    pattern: 'a',
    duration: time.seconds(22),
    reverse: true,
    exitX: -48,
    exitY: 24,
  },
  {
    left: -30,
    top: 236,
    size: 66,
    opacity: 0.8,
    blur: 1,
    pattern: 'c',
    duration: time.seconds(16),
    exitX: -72,
    exitY: 24,
  },
  {
    left: 63,
    top: -30,
    size: 86,
    opacity: 0.8,
    blur: 2,
    pattern: 'a',
    duration: time.seconds(14),
    exitX: -48,
    exitY: -54,
  },
  {
    left: 348,
    top: 126,
    size: 74,
    opacity: 0.9,
    blur: 1.5,
    pattern: 'b',
    duration: time.seconds(18),
    exitX: 96,
    exitY: -24,
  },
  {
    left: 300,
    top: 271,
    size: 42,
    opacity: 1,
    blur: 1,
    pattern: 'd',
    duration: time.seconds(20),
    exitX: 72,
    exitY: 60,
  },
  {
    left: 333,
    top: 408,
    size: 90,
    opacity: 0.7,
    blur: 2,
    pattern: 'b',
    duration: time.seconds(15),
    reverse: true,
    exitX: 78,
    exitY: 36,
  },
];

type FloatingCoinsState = 'visible' | 'hidden' | 'claimed';

const FloatingCoin = memo(function FloatingCoin({ config, state }: { config: CoinConfig; state: SharedValue<FloatingCoinsState> }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const exitProgress = useSharedValue(0);

  const { left, top, size } = config;

  const claimedLeft = CLAIMED_CENTER.x - size / 2;
  const claimedTop = CLAIMED_CENTER.y;

  const startFloatingAnimation = useCallback(() => {
    'worklet';
    const pattern = FLOAT_PATTERNS[config.pattern];
    const x = config.reverse ? -pattern.x : pattern.x;
    const y = config.reverse ? -pattern.y : pattern.y;

    const timingConfig = { duration: config.duration / 2, easing: FLOAT_EASING };

    translateX.value = withRepeat(withSequence(withTiming(x, timingConfig), withTiming(0, timingConfig)), -1);
    translateY.value = withRepeat(withSequence(withTiming(y, timingConfig), withTiming(0, timingConfig)), -1);
  }, [config.pattern, config.reverse, translateX, translateY, config.duration]);

  const stopFloatingAnimation = useCallback(() => {
    'worklet';
    cancelAnimation(translateX);
    cancelAnimation(translateY);
  }, [translateX, translateY]);

  useAnimatedReaction(
    () => state.value,
    (current, previous) => {
      if (current === previous) return;
      if (current === 'visible') {
        startFloatingAnimation();
      } else {
        stopFloatingAnimation();
      }
    },
    [startFloatingAnimation, stopFloatingAnimation]
  );

  // Animate off screen for 'hidden' and behind primary coin icon for 'claimed' state
  useAnimatedReaction(
    () => {
      return state.value;
    },
    current => {
      let delay = 0;
      if (current === 'claimed') {
        const distanceFromClaimPosition = Math.sqrt(Math.pow(claimedLeft - left, 2) + Math.pow(claimedTop - top, 2));
        // Normalize distance to 0-1 from 200-300
        const normalizedDistance = Math.max(0, Math.min(1, (distanceFromClaimPosition - 200) / 100));
        delay = normalizedDistance * time.ms(100);
      }

      exitProgress.value = withDelay(
        delay,
        withTiming(current === 'visible' ? 0 : 1, {
          duration: EXIT_DURATION,
          easing: EXIT_EASING,
        })
      );
    },
    [state, exitProgress]
  );

  const containerStyle = useAnimatedStyle(() => {
    if (state.value === 'claimed') {
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
    if (state.value === 'claimed') {
      return {
        opacity: interpolate(exitProgress.value, [0, 1], [config.opacity, 0]),
        transform: [{ scale: interpolate(exitProgress.value, [0, 1], [1, 0.6]) }],
      };
    }

    return {
      opacity: interpolate(exitProgress.value, [0, 1], [config.opacity, 0]),
      transform: [
        { translateX: interpolate(exitProgress.value, [0, 1], [0, config.exitX]) },
        { translateY: interpolate(exitProgress.value, [0, 1], [0, config.exitY]) },
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
});

export const FloatingCoins = memo(function FloatingCoins() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { activeStep } = useRnbwAirdropContext();
  const state = useDerivedValue(() => {
    switch (activeStep.value) {
      case ClaimSteps.Introduction:
      case ClaimSteps.Claim:
        return 'visible';
      case ClaimSteps.CheckingAirdrop:
        return 'hidden';
      case ClaimSteps.NothingToClaim:
        return 'claimed';
      default:
        return 'hidden';
    }
  }, [activeStep]);

  const scaledCoins: CoinConfig[] = useMemo(() => {
    const scaleX = screenWidth / DESIGN_WIDTH;
    const scaleY = screenHeight / DESIGN_HEIGHT;

    return COINS.map(({ left, top, size, ...config }) => ({
      ...config,
      left: left * scaleX,
      top: top * scaleY,
      exitX: config.exitX * scaleX,
      exitY: config.exitY * scaleY,
      size: size * scaleX,
    }));
  }, [screenHeight, screenWidth]);

  return (
    <View style={styles.container} pointerEvents="none">
      {scaledCoins.map((config, index) => (
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
