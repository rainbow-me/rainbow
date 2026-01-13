import { memo, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';
import { globalColors } from '@/design-system/color/palettes';
import rnbwCoinImage from '@/assets/rnbw.png';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedReaction,
  useAnimatedStyle,
  withDelay,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { RnbwRewardsScene, RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useRnbwRewardsFlowContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { time } from '@/utils/time';
import { transitionEasing } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { LoadingSpinner } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/LoadingSpinner';
import concentricCircleImage from '@/features/rnbw-rewards/assets/radial-circle.png';
import { SpinnableCoin, SpinnableCoinHandle } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/SpinnableCoin';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { useRewardsFlowStore } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import { Blur, Canvas, RoundedRect } from '@shopify/react-native-skia';

const COIN_SIZE = 160;
const SMALL_COIN_SIZE = 90;
const MEDIUM_COIN_SIZE = 108;
const LOADING_SPINNER_SIZE = 112;
const SMALL_COIN_SCALE = SMALL_COIN_SIZE / COIN_SIZE;
const MEDIUM_COIN_SCALE = MEDIUM_COIN_SIZE / COIN_SIZE;

const CONCENTRIC_CIRCLE_SIZE = 633;
const INNERMOST_CIRCLE_SIZE = 182;
const BLUR_INTENSITY = 47;
const BLUR_EXTENT = BLUR_INTENSITY * 3;
const BLUR_CIRCLE_SIZE = 224;

const STEP_TRANSITION_DELAY = time.ms(100);

// These translations are relative to the bottom of the navbar on the rewards screen
const scenesConfig: Record<RnbwRewardsScene, { scale: number; translateY: number }> = {
  [RnbwRewardsScenes.AirdropIntro]: {
    scale: 1,
    translateY: 15,
  },
  [RnbwRewardsScenes.AirdropEligibility]: {
    scale: SMALL_COIN_SCALE,
    translateY: 202,
  },
  [RnbwRewardsScenes.AirdropClaimPrompt]: {
    scale: 1,
    translateY: 15,
  },
  [RnbwRewardsScenes.RewardsOverview]: {
    scale: MEDIUM_COIN_SCALE,
    translateY: 24,
  },
  [RnbwRewardsScenes.AirdropClaiming]: {
    scale: SMALL_COIN_SCALE,
    translateY: 202,
  },
  [RnbwRewardsScenes.RewardsClaiming]: {
    scale: SMALL_COIN_SCALE,
    translateY: 202,
  },
  [RnbwRewardsScenes.AirdropClaimed]: {
    scale: MEDIUM_COIN_SCALE,
    translateY: 186,
  },
  [RnbwRewardsScenes.RewardsClaimed]: {
    scale: MEDIUM_COIN_SCALE,
    translateY: 186,
  },
  [RnbwRewardsScenes.AirdropUnavailable]: {
    scale: MEDIUM_COIN_SCALE,
    translateY: 186,
  },
};

const loadingSpinnerTop =
  scenesConfig[RnbwRewardsScenes.AirdropEligibility].translateY -
  (LOADING_SPINNER_SIZE - COIN_SIZE * scenesConfig[RnbwRewardsScenes.AirdropEligibility].scale) / 2;

const timingConfig = { duration: time.seconds(1), easing: transitionEasing };
const loadingSpinnerEnteringAnimation = FadeIn.delay(timingConfig.duration * 0.5).easing(transitionEasing);
const loadingSpinnerExitingAnimation = FadeOut.easing(transitionEasing);

const successIconEnterAnimation = ZoomIn.duration(timingConfig.duration * 0.25)
  .delay(timingConfig.duration * 0.25)
  .easing(transitionEasing);
const successIconExitAnimation = ZoomOut.easing(transitionEasing);

export const RnbwHeroCoin = memo(function RnbwHeroCoin() {
  const { activeScene } = useRnbwRewardsFlowContext();
  const activeSceneState = useRewardsFlowStore(state => state.activeScene);
  const coinRef = useRef<SpinnableCoinHandle>(null);

  useAnimatedReaction(
    () => activeScene.value,
    (current, previous) => {
      if (current === RnbwRewardsScenes.AirdropClaiming && previous === RnbwRewardsScenes.AirdropClaimPrompt) {
        coinRef.current?.spin({ turns: 0.5, durationMs: time.seconds(1.8) });
      } else if (current === RnbwRewardsScenes.AirdropClaimPrompt && previous === RnbwRewardsScenes.AirdropEligibility) {
        coinRef.current?.spin({ turns: 2, durationMs: time.seconds(3) });
      } else if (current === RnbwRewardsScenes.RewardsOverview && previous === RnbwRewardsScenes.AirdropClaimed) {
        coinRef.current?.spin({ turns: 0.5, durationMs: time.seconds(1.8) });
      } else if (current === RnbwRewardsScenes.RewardsOverview && previous === RnbwRewardsScenes.RewardsClaimed) {
        coinRef.current?.spin({ turns: 0.5, durationMs: time.seconds(1.8) });
      } else if (current === RnbwRewardsScenes.RewardsClaiming && previous === RnbwRewardsScenes.RewardsOverview) {
        coinRef.current?.spin({ turns: 0.5, durationMs: time.seconds(3) });
      }
    },
    []
  );

  const coinAnimatedStyle = useAnimatedStyle(() => {
    const config = scenesConfig[activeScene.value];
    return {
      transform: [
        { translateY: withDelay(STEP_TRANSITION_DELAY, withTiming(config.translateY, timingConfig)) },
        { scale: withDelay(STEP_TRANSITION_DELAY, withTiming(config.scale, timingConfig)) },
      ],
    };
  }, [activeScene]);

  const concentricCircleAnimatedStyle = useAnimatedStyle(() => {
    const config = scenesConfig[activeScene.value];
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
  }, [activeScene]);

  const blurAnimatedStyle = useAnimatedStyle(() => {
    const config = scenesConfig[activeScene.value];
    const coinSize = COIN_SIZE * config.scale;
    const top = config.translateY + coinSize / 2 - BLUR_CIRCLE_SIZE / 2;
    const opacity = activeScene.value === RnbwRewardsScenes.AirdropEligibility ? 0 : 1;

    return {
      opacity: withDelay(STEP_TRANSITION_DELAY, withTiming(opacity, timingConfig)),
      transform: [
        { translateY: withDelay(STEP_TRANSITION_DELAY, withTiming(top, timingConfig)) },
        { scale: withDelay(STEP_TRANSITION_DELAY, withTiming(config.scale, timingConfig)) },
      ],
    };
  }, [activeScene]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.blurContainer, blurAnimatedStyle]}>
        <Canvas
          style={{
            width: BLUR_CIRCLE_SIZE + BLUR_EXTENT * 2,
            height: BLUR_CIRCLE_SIZE + BLUR_EXTENT * 2,
          }}
        >
          <RoundedRect
            x={BLUR_EXTENT}
            y={BLUR_EXTENT}
            width={BLUR_CIRCLE_SIZE}
            height={BLUR_CIRCLE_SIZE}
            r={BLUR_CIRCLE_SIZE / 2}
            color={opacity('#F6D56B', 0.2)}
          >
            <Blur blur={BLUR_INTENSITY} />
          </RoundedRect>
        </Canvas>
      </Animated.View>

      <Animated.View style={[styles.concentricCircleContainer, concentricCircleAnimatedStyle]}>
        <Image source={concentricCircleImage} style={styles.concentricCircle} />
      </Animated.View>

      <Animated.View style={[styles.coinContainer, coinAnimatedStyle]}>
        <SpinnableCoin ref={coinRef} source={rnbwCoinImage} size={COIN_SIZE} />
        {(activeSceneState === RnbwRewardsScenes.AirdropClaimed || activeSceneState === RnbwRewardsScenes.RewardsClaimed) && (
          <Animated.View style={styles.successIcon} entering={successIconEnterAnimation} exiting={successIconExitAnimation}>
            <Box
              backgroundColor="#1F9E39"
              width={52}
              height={52}
              borderRadius={26}
              justifyContent="center"
              alignItems="center"
              borderWidth={THICK_BORDER_WIDTH}
              borderColor={{ custom: opacity(globalColors.white100, 0.12) }}
              shadow={'24px'}
            >
              <InnerShadow color={opacity(globalColors.white100, 0.28)} width={52} height={52} blur={3.5} dx={0} dy={6} />
              <Text color="label" size="26pt" weight="heavy" align="center">
                {'􀆅'}
              </Text>
            </Box>
          </Animated.View>
        )}
      </Animated.View>

      <CoinLoadingSpinner />
    </View>
  );
});

function CoinLoadingSpinner() {
  const activeSceneState = useRewardsFlowStore(state => state.activeScene);
  const isLoading =
    activeSceneState === RnbwRewardsScenes.AirdropEligibility ||
    activeSceneState === RnbwRewardsScenes.AirdropClaiming ||
    activeSceneState === RnbwRewardsScenes.RewardsClaiming;
  if (!isLoading) return null;
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

export function getCoinBottomPosition(scene: RnbwRewardsScene) {
  const config = scenesConfig[scene];
  return config.translateY + COIN_SIZE * config.scale;
}

export function getCoinCenterPosition(scene: RnbwRewardsScene) {
  const config = scenesConfig[scene];
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
    shadowColor: opacity(globalColors.grey100, 0.27),
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 17,
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
    top: 0,
    left: DEVICE_WIDTH / 2 - BLUR_CIRCLE_SIZE / 2,
    width: BLUR_CIRCLE_SIZE,
    height: BLUR_CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  successIcon: {
    position: 'absolute',
    bottom: 0,
    right: -4,
  },
});
