import { RnbwRewardsScene, RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useRnbwRewardsFlowContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import { Blur, Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { interpolate, interpolateColor, useAnimatedReaction, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { memo, useMemo } from 'react';
import useDimensions from '@/hooks/useDimensions';
import { time } from '@/utils/time';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';

type GradientConfig = {
  colors: readonly string[];
  positions: readonly number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

type SceneGradient = {
  scene: RnbwRewardsScene;
  gradient: GradientConfig;
  opacity: number;
};

const GLOW = {
  width: 448,
  height: 695,
  borderRadius: 180,
  blurRadius: 60,
} as const;

const CANVAS_OFFSET_FROM_BOTTOM = 271;
const BLUR_PADDING = GLOW.blurRadius * 2;
const ANIMATION_DURATION_MS = time.ms(300);

const BLUE_ORANGE_GRADIENT: GradientConfig = {
  colors: ['#3887F2', '#40F5CC', '#FF9129', '#FFE636'],
  positions: [0.11, 0.4, 0.64, 0.9],
  start: { x: 0.02, y: 0.69 },
  end: { x: 0.98, y: 0.69 },
};

export const BottomGradientGlow = memo(function BottomGradientGlow() {
  const { width: screenWidth, height: screenHeight } = useDimensions();
  const { activeScene } = useRnbwRewardsFlowContext();
  const hasClaimableAirdrop = useAirdropBalanceStore(state => state.hasClaimableAirdrop());

  const config = useMemo(() => {
    const sceneGradients: SceneGradient[] = [
      { scene: RnbwRewardsScenes.AirdropClaimPrompt, gradient: BLUE_ORANGE_GRADIENT, opacity: 0.2 },
      ...(hasClaimableAirdrop ? [{ scene: RnbwRewardsScenes.RewardsOverview, gradient: BLUE_ORANGE_GRADIENT, opacity: 0.12 }] : []),
      { scene: RnbwRewardsScenes.AirdropClaimed, gradient: BLUE_ORANGE_GRADIENT, opacity: 0.12 },
      { scene: RnbwRewardsScenes.RewardsClaimed, gradient: BLUE_ORANGE_GRADIENT, opacity: 0.12 },
    ];

    const inputRange = sceneGradients.map((_, index) => index);
    const sceneIndex = sceneGradients.reduce<Partial<Record<RnbwRewardsScene, number>>>(
      (acc, item, index) => {
        acc[item.scene] = index;
        return acc;
      },
      {} as Partial<Record<RnbwRewardsScene, number>>
    );
    const sceneOpacity = sceneGradients.reduce<Partial<Record<RnbwRewardsScene, number>>>(
      (acc, item) => {
        acc[item.scene] = item.opacity;
        return acc;
      },
      {} as Partial<Record<RnbwRewardsScene, number>>
    );

    const gradientSequence = sceneGradients.map(item => item.gradient);

    const buildStopOutputRanges = <T,>(configs: GradientConfig[], selector: (config: GradientConfig) => readonly T[]) => {
      const stopCount = selector(configs[0]).length;
      const outputRanges: T[][] = Array.from({ length: stopCount }, () => []);
      for (const config of configs) {
        const stops = selector(config);
        for (let i = 0; i < stopCount; i += 1) {
          outputRanges[i].push(stops[i]);
        }
      }
      return outputRanges;
    };

    const colorStops = buildStopOutputRanges(gradientSequence, config => config.colors);
    const positionStops = buildStopOutputRanges(gradientSequence, config => config.positions);
    const startX = gradientSequence.map(config => config.start.x);
    const startY = gradientSequence.map(config => config.start.y);
    const endX = gradientSequence.map(config => config.end.x);
    const endY = gradientSequence.map(config => config.end.y);

    return {
      sceneIndex,
      sceneOpacity,
      inputRange,
      colorStops,
      positionStops,
      startX,
      startY,
      endX,
      endY,
    };
  }, [hasClaimableAirdrop]);

  const sceneProgress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useAnimatedReaction(
    () => activeScene.value,
    scene => {
      const targetIndex = config.sceneIndex[scene];
      const targetOpacity = config.sceneOpacity[scene];
      if (targetIndex !== undefined && targetOpacity !== undefined) {
        sceneProgress.value = withTiming(targetIndex, { duration: ANIMATION_DURATION_MS });
        opacity.value = withTiming(targetOpacity, { duration: ANIMATION_DURATION_MS });
        return;
      }
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION_MS });
    },
    [activeScene, config]
  );

  const colors = useDerivedValue(() => {
    const value = sceneProgress.value;
    const result = new Array(config.colorStops.length);
    for (let i = 0; i < config.colorStops.length; i += 1) {
      result[i] = interpolateColor(value, config.inputRange, config.colorStops[i]);
    }
    return result;
  }, [sceneProgress, config]);

  const positions = useDerivedValue(() => {
    const value = sceneProgress.value;
    const result = new Array(config.positionStops.length);
    for (let i = 0; i < config.positionStops.length; i += 1) {
      result[i] = interpolate(value, config.inputRange, config.positionStops[i]);
    }
    return result;
  }, [sceneProgress, config]);

  const start = useDerivedValue(() => {
    const value = sceneProgress.value;
    return vec(
      BLUR_PADDING + GLOW.width * interpolate(value, config.inputRange, config.startX),
      BLUR_PADDING + GLOW.height * interpolate(value, config.inputRange, config.startY)
    );
  }, [sceneProgress, config]);

  const end = useDerivedValue(() => {
    const value = sceneProgress.value;
    return vec(
      BLUR_PADDING + GLOW.width * interpolate(value, config.inputRange, config.endX),
      BLUR_PADDING + GLOW.height * interpolate(value, config.inputRange, config.endY)
    );
  }, [sceneProgress, config]);

  const canvasWidth = GLOW.width + BLUR_PADDING * 2;
  const canvasHeight = GLOW.height + BLUR_PADDING * 2;

  return (
    <Canvas
      style={{
        position: 'absolute',
        width: canvasWidth,
        height: canvasHeight,
        top: screenHeight - CANVAS_OFFSET_FROM_BOTTOM - BLUR_PADDING,
        left: screenWidth / 2 - GLOW.width / 2 - BLUR_PADDING,
      }}
    >
      <RoundedRect x={BLUR_PADDING} y={BLUR_PADDING} width={GLOW.width} height={GLOW.height} r={GLOW.borderRadius} opacity={opacity}>
        <LinearGradient start={start} end={end} colors={colors} positions={positions} />
        <Blur blur={GLOW.blurRadius} />
      </RoundedRect>
    </Canvas>
  );
});
