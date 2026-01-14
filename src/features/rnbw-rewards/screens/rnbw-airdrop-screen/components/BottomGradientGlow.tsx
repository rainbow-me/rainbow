import { ClaimStep, ClaimSteps, useRnbwAirdropContext } from '@/features/rnbw-rewards/context/RnbwAirdropContext';
import { Blur, Canvas, Group, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { interpolate, interpolateColor, useAnimatedReaction, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { memo } from 'react';
import useDimensions from '@/hooks/useDimensions';

type GradientConfig = {
  colors: readonly string[];
  positions: readonly number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

const GLOW = {
  width: 448,
  height: 695,
  borderRadius: 180,
  blurRadius: 60,
} as const;

const CANVAS_OFFSET_FROM_BOTTOM = 271;
const CANVAS_PADDING = GLOW.blurRadius * 2;
const DRAW_OFFSET = CANVAS_PADDING - GLOW.blurRadius;
const ANIMATION_DURATION_MS = 300;
const VISIBLE_OPACITY = 0.2;

const CLAIM_GRADIENT: GradientConfig = {
  colors: ['#3887F2', '#40F5CC', '#FF9129', '#FFE636'],
  positions: [0.11, 0.4, 0.64, 0.9],
  start: { x: 0.02, y: 0.69 },
  end: { x: 0.98, y: 0.69 },
};
const NOTHING_TO_CLAIM_GRADIENT: GradientConfig = {
  colors: ['#C73BF2', '#40F5CC', '#3887F2', '#FFE636'],
  positions: [0.09, 0.29, 0.62, 0.91],
  start: { x: 0.26, y: 0.8 },
  end: { x: 1.31, y: 0.67 },
};

type StepGradient = {
  step: ClaimStep;
  gradient: GradientConfig;
};

const STEP_GRADIENTS: StepGradient[] = [
  { step: ClaimSteps.Claim, gradient: CLAIM_GRADIENT },
  { step: ClaimSteps.NothingToClaim, gradient: NOTHING_TO_CLAIM_GRADIENT },
];

const INPUT_RANGE = STEP_GRADIENTS.map((_, index) => index);
const STEP_INDEX = STEP_GRADIENTS.reduce<Partial<Record<ClaimStep, number>>>(
  (acc, item, index) => {
    acc[item.step] = index;
    return acc;
  },
  {} as Partial<Record<ClaimStep, number>>
);

const GRADIENT_SEQUENCE = STEP_GRADIENTS.map(item => item.gradient);

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

const COLOR_STOPS = buildStopOutputRanges(GRADIENT_SEQUENCE, config => config.colors);
const POSITION_STOPS = buildStopOutputRanges(GRADIENT_SEQUENCE, config => config.positions);
const START_X = GRADIENT_SEQUENCE.map(config => config.start.x);
const START_Y = GRADIENT_SEQUENCE.map(config => config.start.y);
const END_X = GRADIENT_SEQUENCE.map(config => config.end.x);
const END_Y = GRADIENT_SEQUENCE.map(config => config.end.y);

export const BottomGradientGlow = memo(function BottomGradientGlow() {
  const { width: screenWidth, height: screenHeight } = useDimensions();
  const { activeStep } = useRnbwAirdropContext();

  const stepProgress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useAnimatedReaction(
    () => activeStep.value,
    step => {
      'worklet';
      const targetIndex = STEP_INDEX[step];
      if (targetIndex !== undefined) {
        stepProgress.value = withTiming(targetIndex, { duration: ANIMATION_DURATION_MS });
        opacity.value = withTiming(VISIBLE_OPACITY, { duration: ANIMATION_DURATION_MS });
        return;
      }
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION_MS });
    },
    [activeStep]
  );

  const colors = useDerivedValue(() => {
    'worklet';
    const value = stepProgress.value;
    const result = new Array(COLOR_STOPS.length);
    for (let i = 0; i < COLOR_STOPS.length; i += 1) {
      result[i] = interpolateColor(value, INPUT_RANGE, COLOR_STOPS[i]);
    }
    return result;
  }, [stepProgress]);

  const positions = useDerivedValue(() => {
    'worklet';
    const value = stepProgress.value;
    const result = new Array(POSITION_STOPS.length);
    for (let i = 0; i < POSITION_STOPS.length; i += 1) {
      result[i] = interpolate(value, INPUT_RANGE, POSITION_STOPS[i]);
    }
    return result;
  }, [stepProgress]);

  const start = useDerivedValue(() => {
    'worklet';
    const value = stepProgress.value;
    return vec(
      GLOW.blurRadius + GLOW.width * interpolate(value, INPUT_RANGE, START_X),
      GLOW.blurRadius + GLOW.height * interpolate(value, INPUT_RANGE, START_Y)
    );
  }, [stepProgress]);

  const end = useDerivedValue(() => {
    'worklet';
    const value = stepProgress.value;
    return vec(
      GLOW.blurRadius + GLOW.width * interpolate(value, INPUT_RANGE, END_X),
      GLOW.blurRadius + GLOW.height * interpolate(value, INPUT_RANGE, END_Y)
    );
  }, [stepProgress]);

  const canvasWidth = GLOW.width + CANVAS_PADDING * 2;
  const canvasHeight = GLOW.height + CANVAS_PADDING * 2;

  return (
    <Canvas
      style={{
        position: 'absolute',
        width: canvasWidth,
        height: canvasHeight,
        top: screenHeight - CANVAS_OFFSET_FROM_BOTTOM - CANVAS_PADDING,
        left: screenWidth / 2 - GLOW.width / 2 - CANVAS_PADDING,
      }}
    >
      <Group transform={[{ translateX: DRAW_OFFSET }, { translateY: DRAW_OFFSET }]}>
        <RoundedRect
          x={GLOW.blurRadius}
          y={GLOW.blurRadius}
          width={GLOW.width}
          height={GLOW.height}
          r={GLOW.borderRadius}
          opacity={opacity}
        >
          <LinearGradient start={start} end={end} colors={colors} positions={positions} />
          <Blur blur={GLOW.blurRadius} />
        </RoundedRect>
      </Group>
    </Canvas>
  );
});
