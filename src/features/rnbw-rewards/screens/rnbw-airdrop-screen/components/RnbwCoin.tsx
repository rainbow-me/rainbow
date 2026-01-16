import { memo, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import rnbwCoinImage from '@/assets/rnbw.png';
import Animated, { FadeIn, FadeOut, useAnimatedReaction, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { ClaimStep, ClaimSteps, useRnbwAirdropContext } from '@/features/rnbw-rewards/context/RnbwAirdropContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { time } from '@/utils/time';
import { transitionEasing } from '@/features/rnbw-rewards/animations/layoutAnimations';
import { LoadingSpinner } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/LoadingSpinner';
import concentricCircleImage from '@/features/rnbw-rewards/assets/radial-circle.png';
import { SpinnableCoin, SpinnableCoinHandle } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/SpinnableCoin';
import { BlurView } from 'react-native-blur-view';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

const COIN_SIZE = 160;
const SMALL_COIN_SIZE = 90;
const MEDIUM_COIN_SIZE = 120;
const LOADING_SPINNER_SIZE = 112;
const SMALL_COIN_SCALE = SMALL_COIN_SIZE / COIN_SIZE;
const MEDIUM_COIN_SCALE = MEDIUM_COIN_SIZE / COIN_SIZE;

const CONCENTRIC_CIRCLE_SIZE = 633;
const INNERMOST_CIRCLE_SIZE = 182;
const BLUR_INTENSITY = 94 / 2;
const BLUR_EXTENT = BLUR_INTENSITY * 3;
const BLUR_CIRCLE_SIZE = 224;

const STEP_TRANSITION_DELAY = time.ms(100);

const stepsConfig: Record<ClaimStep, { scale: number; translateY: number }> = {
  [ClaimSteps.Introduction]: {
    scale: 1,
    translateY: 88,
  },
  [ClaimSteps.CheckingAirdrop]: {
    scale: SMALL_COIN_SCALE,
    translateY: 275,
  },
  [ClaimSteps.Claim]: {
    scale: 1,
    translateY: 88,
  },
  [ClaimSteps.NothingToClaim]: {
    scale: MEDIUM_COIN_SCALE,
    translateY: 72,
  },
};

const loadingSpinnerTop =
  stepsConfig[ClaimSteps.CheckingAirdrop].translateY -
  (LOADING_SPINNER_SIZE - COIN_SIZE * stepsConfig[ClaimSteps.CheckingAirdrop].scale) / 2;

const timingConfig = { duration: time.seconds(1), easing: transitionEasing };
const loadingSpinnerEnteringAnimation = FadeIn.delay(timingConfig.duration * 0.5).easing(transitionEasing);
const loadingSpinnerExitingAnimation = FadeOut.easing(transitionEasing);

export const RnbwCoin = memo(function RnbwCoin() {
  const { activeStep } = useRnbwAirdropContext();
  const coinRef = useRef<SpinnableCoinHandle>(null);

  useAnimatedReaction(
    () => activeStep.value,
    (current, previous) => {
      if (current === ClaimSteps.CheckingAirdrop && previous === ClaimSteps.Introduction) {
        coinRef.current?.spin({ turns: 0.5, durationMs: time.seconds(1.8) });
      } else if (current === ClaimSteps.Claim && previous === ClaimSteps.CheckingAirdrop) {
        coinRef.current?.spin({ turns: 2, durationMs: time.seconds(3) });
      } else if (current === ClaimSteps.NothingToClaim && previous === ClaimSteps.Claim) {
        coinRef.current?.spin({ turns: 0.5, durationMs: time.seconds(1.8) });
      }
    },
    []
  );

  const coinAnimatedStyle = useAnimatedStyle(() => {
    const config = stepsConfig[activeStep.value];
    return {
      transform: [
        { translateY: withDelay(STEP_TRANSITION_DELAY, withTiming(config.translateY, timingConfig)) },
        { scale: withDelay(STEP_TRANSITION_DELAY, withTiming(config.scale, timingConfig)) },
      ],
    };
  }, [activeStep]);

  const concentricCircleAnimatedStyle = useAnimatedStyle(() => {
    const config = stepsConfig[activeStep.value];
    const coinSize = COIN_SIZE * config.scale;
    const coinRadius = coinSize / 2;
    const coinTopY = config.translateY;

    const circleSize = CONCENTRIC_CIRCLE_SIZE * config.scale;
    const circleCenter = getCircleRelativeCenterPoint(circleSize);
    const top = coinTopY - circleCenter.y + coinRadius;

    return {
      transform: [
        { translateY: withDelay(STEP_TRANSITION_DELAY, withTiming(top, timingConfig)) },
        { scale: withDelay(STEP_TRANSITION_DELAY, withTiming(config.scale, timingConfig)) },
      ],
    };
  }, [activeStep]);

  const blurAnimatedStyle = useAnimatedStyle(() => {
    const config = stepsConfig[activeStep.value];
    const coinSize = COIN_SIZE * config.scale;
    const top = config.translateY + coinSize / 2 - BLUR_CIRCLE_SIZE / 2;
    const opacity = activeStep.value === ClaimSteps.CheckingAirdrop ? 0 : 1;

    return {
      opacity: withDelay(STEP_TRANSITION_DELAY, withTiming(opacity, timingConfig)),
      top: withDelay(STEP_TRANSITION_DELAY, withTiming(top, timingConfig)),
      transform: [{ scale: withDelay(STEP_TRANSITION_DELAY, withTiming(config.scale, timingConfig)) }],
    };
  }, [activeStep]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.blurContainer, blurAnimatedStyle]}>
        <View style={styles.blurCircle} />
        <BlurView
          style={[
            styles.blurView,
            {
              top: -BLUR_EXTENT,
              left: -BLUR_EXTENT,
              right: -BLUR_EXTENT,
              bottom: -BLUR_EXTENT,
            },
          ]}
          blurStyle="plain"
          blurIntensity={BLUR_INTENSITY}
        />
      </Animated.View>

      <Animated.View style={[styles.concentricCircleContainer, concentricCircleAnimatedStyle]}>
        <Image source={concentricCircleImage} style={styles.concentricCircle} />
      </Animated.View>

      <Animated.View style={[styles.coinContainer, coinAnimatedStyle]}>
        <SpinnableCoin ref={coinRef} source={rnbwCoinImage} size={COIN_SIZE} />
      </Animated.View>

      <CoinLoadingSpinner />
    </View>
  );
});

function CoinLoadingSpinner() {
  const { activeStepState } = useRnbwAirdropContext();
  if (activeStepState !== ClaimSteps.CheckingAirdrop) return null;
  return (
    <Animated.View style={styles.loadingSpinner} entering={loadingSpinnerEnteringAnimation} exiting={loadingSpinnerExitingAnimation}>
      <LoadingSpinner color={'#F6D66C'} size={LOADING_SPINNER_SIZE} strokeWidth={2} />
    </Animated.View>
  );
}

function getCircleRelativeCenterPoint(size: number) {
  'worklet';
  const circleSizeScale = size / CONCENTRIC_CIRCLE_SIZE;
  const outerHeight = size;
  const innerHeight = INNERMOST_CIRCLE_SIZE * circleSizeScale;

  // This is the approximate offset relative to the absolute center of the image that the innermost circle is shifted by.
  const offsetPercent = 0.095;

  // Calculate the innermost circle's actual top position
  const centeredGap = (outerHeight - innerHeight) / 2;
  const offsetDistance = offsetPercent * centeredGap;
  const actualTop = centeredGap + offsetDistance;

  const innerCircleCenterY = actualTop + innerHeight / 2;

  return {
    x: size / 2,
    y: innerCircleCenterY,
  };
}

// TODO: bad name
export function getCoinBottomPosition(step: ClaimStep) {
  const config = stepsConfig[step];
  return config.translateY + COIN_SIZE * config.scale;
}

export function getCoinCenterPosition(step: ClaimStep) {
  const config = stepsConfig[step];
  const coinSize = COIN_SIZE * config.scale;
  return {
    x: DEVICE_WIDTH / 2,
    y: config.translateY + coinSize / 2,
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  coinContainer: {
    position: 'absolute',
    left: DEVICE_WIDTH / 2 - COIN_SIZE / 2,
    transformOrigin: 'center top',
  },
  coin: {
    width: COIN_SIZE,
    height: COIN_SIZE,
  },
  loadingSpinner: {
    position: 'absolute',
    top: loadingSpinnerTop,
    left: DEVICE_WIDTH / 2 - LOADING_SPINNER_SIZE / 2,
    width: LOADING_SPINNER_SIZE,
    height: LOADING_SPINNER_SIZE,
    transformOrigin: 'center top',
  },
  concentricCircleContainer: {
    position: 'absolute',
    left: DEVICE_WIDTH / 2 - CONCENTRIC_CIRCLE_SIZE / 2,
    transformOrigin: 'center top',
  },
  concentricCircle: {
    width: CONCENTRIC_CIRCLE_SIZE,
    height: CONCENTRIC_CIRCLE_SIZE,
  },
  blurContainer: {
    position: 'absolute',
    left: DEVICE_WIDTH / 2 - BLUR_CIRCLE_SIZE / 2,
    width: BLUR_CIRCLE_SIZE,
    height: BLUR_CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  blurCircle: {
    width: BLUR_CIRCLE_SIZE,
    height: BLUR_CIRCLE_SIZE,
    borderRadius: BLUR_CIRCLE_SIZE / 2,
    backgroundColor: opacityWorklet('#F6D56B', 0.2),
  },
  blurView: {
    position: 'absolute',
  },
});
