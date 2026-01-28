import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, Image } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'react-native-blur-view';
import rnbwCoin from '@/assets/rnbw.png';
import { time } from '@/utils/time';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useRnbwRewardsFlowContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import { getCoinCenterPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';

// Original design dimensions
const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

const FLOAT_EASING = Easing.inOut(Easing.ease);
const EXIT_EASING = Easing.bezier(0.2, 0.9, 0.2, 1);
const EXIT_DURATION = time.seconds(1);
// Buffer past exit duration to ensure coins finish animating off-screen before unmount.
const HIDDEN_UNMOUNT_DELAY = EXIT_DURATION + time.ms(200);

const CLAIMED_CENTER = getCoinCenterPosition(RnbwRewardsScenes.AirdropClaimed);

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

type AmbientCoinsState = 'visible' | 'hidden' | 'claimed';

const AmbientCoin = memo(function AmbientCoin({
  config,
  state,
  entering,
}: {
  config: CoinConfig;
  state: SharedValue<AmbientCoinsState>;
  entering: boolean;
}) {
  const floatProgress = useSharedValue(0);
  const exitProgress = useSharedValue(0);
  const didEnter = useSharedValue(false);

  const { left, top, size } = config;

  const claimedLeft = CLAIMED_CENTER.x - size / 2;
  const claimedTop = CLAIMED_CENTER.y;

  const startFloatingAnimation = useCallback(() => {
    'worklet';
    const timingConfig = { duration: config.duration / 2, easing: FLOAT_EASING };
    floatProgress.value = withRepeat(withTiming(1, timingConfig), -1, true);
  }, [config.duration, floatProgress]);

  const stopFloatingAnimation = useCallback(() => {
    'worklet';
    cancelAnimation(floatProgress);
  }, [floatProgress]);

  const floatX = useDerivedValue(() => {
    const pattern = FLOAT_PATTERNS[config.pattern];
    const x = config.reverse ? -pattern.x : pattern.x;
    return interpolate(floatProgress.value, [0, 1], [0, x]);
  }, [config.pattern, config.reverse]);

  const floatY = useDerivedValue(() => {
    const pattern = FLOAT_PATTERNS[config.pattern];
    const y = config.reverse ? -pattern.y : pattern.y;
    return interpolate(floatProgress.value, [0, 1], [0, y]);
  }, [config.pattern, config.reverse]);

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

  useEffect(() => {
    return () => {
      stopFloatingAnimation();
      cancelAnimation(exitProgress);
    };
  }, [exitProgress, stopFloatingAnimation]);

  // Animate off screen for 'hidden' and behind primary coin icon for 'claimed' state
  useAnimatedReaction(
    () => state.value,
    current => {
      let delay = 0;
      if (current === 'claimed') {
        const distanceFromClaimPosition = Math.sqrt(Math.pow(claimedLeft - left, 2) + Math.pow(claimedTop - top, 2));
        // Normalize distance to 0-1 from 200-300
        const normalizedDistance = Math.max(0, Math.min(1, (distanceFromClaimPosition - 200) / 100));
        delay = normalizedDistance * time.ms(100);
      }

      if (current === 'visible' && entering && !didEnter.value) {
        // Start from hidden when remounting after being offscreen.
        exitProgress.value = 1;
        didEnter.value = true;
      }

      exitProgress.value = withDelay(
        delay,
        withTiming(current === 'visible' ? 0 : 1, {
          duration: EXIT_DURATION,
          easing: EXIT_EASING,
        })
      );
    },
    [entering, exitProgress, claimedLeft, claimedTop, left, top]
  );

  const containerStyle = useAnimatedStyle(() => {
    if (state.value === 'claimed') {
      return {
        left: interpolate(exitProgress.value, [0, 1], [left, claimedLeft]),
        top: interpolate(exitProgress.value, [0, 1], [top, claimedTop]),
        transform: [{ translateX: floatX.value }, { translateY: floatY.value }],
      };
    }

    return {
      left,
      top,
      transform: [{ translateX: floatX.value }, { translateY: floatY.value }],
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

const _AmbientCoins = memo(function _AmbientCoins({ state, entering }: { state: SharedValue<AmbientCoinsState>; entering: boolean }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

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
        <AmbientCoin key={index} config={config} state={state} entering={entering} />
      ))}
    </View>
  );
});

export const AmbientCoins = memo(function AmbientCoins() {
  const { activeScene } = useRnbwRewardsFlowContext();
  const [shouldRender, setShouldRender] = useState(true);
  const [shouldAnimateIn, setShouldAnimateIn] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldRenderRef = useRef(shouldRender);

  const state = useDerivedValue(() => {
    switch (activeScene.value) {
      case RnbwRewardsScenes.AirdropIntro:
      case RnbwRewardsScenes.AirdropClaimPrompt:
        return 'visible';
      case RnbwRewardsScenes.AirdropEligibility:
        return 'hidden';
      case RnbwRewardsScenes.AirdropClaimed:
        return 'claimed';
      default:
        return 'hidden';
    }
  }, [activeScene]);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const show = useCallback(
    (nextState: AmbientCoinsState) => {
      clearHideTimeout();
      if (nextState === 'visible' && !shouldRenderRef.current) {
        setShouldAnimateIn(true);
      }
      shouldRenderRef.current = true;
      setShouldRender(true);
    },
    [clearHideTimeout]
  );

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      shouldRenderRef.current = false;
      setShouldRender(false);
      setShouldAnimateIn(false);
      hideTimeoutRef.current = null;
    }, HIDDEN_UNMOUNT_DELAY);
  }, [clearHideTimeout]);

  useAnimatedReaction(
    () => state.value,
    (current, previous) => {
      if (current === previous) return;
      if (current === 'hidden') {
        runOnJS(scheduleHide)();
      } else {
        runOnJS(show)(current);
      }
    },
    [scheduleHide, show]
  );

  useEffect(() => {
    return () => clearHideTimeout();
  }, [clearHideTimeout]);

  if (!shouldRender) return null;

  return <_AmbientCoins state={state} entering={shouldAnimateIn} />;
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
