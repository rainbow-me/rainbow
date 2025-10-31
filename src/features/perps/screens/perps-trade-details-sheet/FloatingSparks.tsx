import { Blur, Circle, Group, vec } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo } from 'react';
import { Easing, makeMutable, useDerivedValue, withTiming, SharedValue } from 'react-native-reanimated';
import { getRandomInt } from '@/worklets/numbers';
import { time } from '@/utils/time';

const SPARKS_DEFAULTS = {
  spark: {
    color: '#FF584D',
    radius: 4,
    blur: 2,
    height: 225,
    spawnOffset: 8,
    topVisibleOffset: 15,
    topOvershoot: 145,
    baseOpacity: 0.4,
    xPositions: [4, 10, 11, 22, 35, 48, 60, 72, 78, 80, 88, 95] as const,
  },
  timing: {
    travel: { min: time.seconds(2.4), max: time.seconds(5.2) },
    resetHold: { min: time.seconds(0.3), max: time.seconds(1.4) },
    idle: { min: time.seconds(0), max: time.seconds(0.9) },
  },
} as const;

interface SparkRenderState {
  y: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  x: number;
  riseDistance: number;
  color: string;
  radius: number;
  blur: number;
}

type Range = {
  min: number;
  max: number;
};

type SparkResetState = {
  spawnY: number;
  baseOpacity: number;
};

type SparkFactoryConfig = SparkResetState & {
  riseDistance: Range;
  color: string;
  radius: number;
  blur: number;
};

function createSparkState(x: number, config: SparkFactoryConfig): SparkRenderState {
  return {
    y: makeMutable(config.spawnY),
    scale: makeMutable(1),
    opacity: makeMutable(config.baseOpacity),
    x,
    riseDistance: getRandomInt(config.riseDistance.min, config.riseDistance.max),
    color: config.color,
    radius: config.radius,
    blur: config.blur,
  };
}

function resetSparkState(spark: SparkRenderState, config: SparkResetState) {
  'worklet';
  spark.y.value = config.spawnY;
  spark.scale.value = 1;
  spark.opacity.value = config.baseOpacity;
}

const SparkLayer = memo(function SparkLayer({ spark }: { spark: SparkRenderState }) {
  const transformStyle = useDerivedValue(() => [{ translateY: spark.y.value }, { scale: spark.scale.value }]);

  return (
    <Group origin={vec(spark.x, 0)} transform={transformStyle}>
      <Circle cx={spark.x} cy={0} r={spark.radius} color={spark.color} opacity={spark.opacity}>
        <Blur blur={spark.blur} />
      </Circle>
    </Group>
  );
});

export interface FloatingSparksProps {
  width: number;
  height: number;
  sparkColor?: string;
  sparkRadius?: number;
  blur?: number;
  baseOpacity?: number;
  xPositions?: readonly number[];
  riseDistanceRange?: Range;
  timingRanges?: {
    travel?: Range;
    resetHold?: Range;
    idle?: Range;
  };
  direction?: 'up' | 'down';
}

export const FloatingSparks = ({
  width,
  height,
  sparkColor = SPARKS_DEFAULTS.spark.color,
  sparkRadius = SPARKS_DEFAULTS.spark.radius,
  blur = SPARKS_DEFAULTS.spark.blur,
  baseOpacity = SPARKS_DEFAULTS.spark.baseOpacity,
  xPositions = SPARKS_DEFAULTS.spark.xPositions,
  riseDistanceRange,
  timingRanges,
  direction = 'up',
}: FloatingSparksProps) => {
  const isDirectionUp = direction === 'up';
  const spawnOffset = SPARKS_DEFAULTS.spark.spawnOffset;
  const topVisibleOffset = SPARKS_DEFAULTS.spark.topVisibleOffset;
  const topOvershoot = SPARKS_DEFAULTS.spark.topOvershoot;
  const spawnY = isDirectionUp ? height + spawnOffset : -spawnOffset;
  const directionMultiplier = isDirectionUp ? -1 : 1;
  const defaultRiseDistanceRange: Range = {
    min: isDirectionUp ? spawnY - topVisibleOffset : height - topVisibleOffset - spawnY,
    max: isDirectionUp ? spawnY + topOvershoot : height + topOvershoot - spawnY,
  };
  const activeRiseDistanceRange = riseDistanceRange ?? defaultRiseDistanceRange;
  const activeTravelRange = timingRanges?.travel ?? SPARKS_DEFAULTS.timing.travel;
  const activeResetHoldRange = timingRanges?.resetHold ?? SPARKS_DEFAULTS.timing.resetHold;
  const activeIdleRange = timingRanges?.idle ?? SPARKS_DEFAULTS.timing.idle;
  const maxInitialDelay = activeTravelRange.max + activeResetHoldRange.max + activeIdleRange.max;

  const sparkRenderStates = useMemo(
    () =>
      xPositions.map(xPercent =>
        createSparkState((xPercent / 100) * width, {
          spawnY,
          baseOpacity,
          riseDistance: activeRiseDistanceRange,
          color: sparkColor,
          radius: sparkRadius,
          blur,
        })
      ),
    [xPositions, width, spawnY, baseOpacity, activeRiseDistanceRange, sparkColor, sparkRadius, blur]
  );

  useEffect(() => {
    const activeTimers = new Set<ReturnType<typeof setTimeout>>();
    const resetState: SparkResetState = { spawnY, baseOpacity };

    const scheduleTimeout = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        activeTimers.delete(timer);
        callback();
      }, delay);

      activeTimers.add(timer);
    };

    const animateSparkRise = (sparkState: SparkRenderState, duration: number) => {
      'worklet';
      const animationConfig = { duration, easing: Easing.linear };
      sparkState.y.value = withTiming(spawnY + directionMultiplier * sparkState.riseDistance, animationConfig);
      sparkState.scale.value = withTiming(0.1, animationConfig);
      sparkState.opacity.value = withTiming(0, animationConfig);
    };

    const queueNextSparkCycle = (sparkState: SparkRenderState) => {
      const idleMs = getRandomInt(activeIdleRange.min, activeIdleRange.max);

      scheduleTimeout(() => {
        const travelMs = getRandomInt(activeTravelRange.min, activeTravelRange.max);
        animateSparkRise(sparkState, travelMs);

        scheduleTimeout(() => {
          resetSparkState(sparkState, resetState);

          const holdMs = getRandomInt(activeResetHoldRange.min, activeResetHoldRange.max);
          scheduleTimeout(() => queueNextSparkCycle(sparkState), holdMs);
        }, travelMs);
      }, idleMs);
    };

    sparkRenderStates.forEach(sparkState => {
      const initialDelay = getRandomInt(0, maxInitialDelay);
      scheduleTimeout(() => queueNextSparkCycle(sparkState), initialDelay);
    });

    return () => {
      activeTimers.forEach(clearTimeout);
      sparkRenderStates.forEach(sparkState => resetSparkState(sparkState, resetState));
    };
  }, [
    sparkRenderStates,
    spawnY,
    baseOpacity,
    activeTravelRange,
    activeResetHoldRange,
    activeIdleRange,
    maxInitialDelay,
    directionMultiplier,
  ]);

  return (
    <Group>
      {sparkRenderStates.map((sparkState, index) => (
        <SparkLayer key={index} spark={sparkState} />
      ))}
    </Group>
  );
};
