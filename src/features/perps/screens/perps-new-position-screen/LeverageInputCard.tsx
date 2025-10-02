import React, { memo, useCallback } from 'react';
import { runOnJS, runOnUI, SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { useDebouncedCallback } from 'use-debounce';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, Inline, Text, useColorMode } from '@/design-system';
import { Slider, SliderProps } from '@/features/perps/components/Slider';
import { SLIDER_MAX } from '@/features/perps/components/Slider/Slider';
import { INPUT_CARD_HEIGHT, SLIDER_WIDTH } from '@/features/perps/constants';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { useAnimatedTimeout } from '@/hooks/reanimated/useAnimatedTimeout';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { useListen } from '@/state/internal/hooks/useListen';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { time } from '@/utils/time';

const LeverageSlider = ({
  nextTargetProgress,
  onProgressSettleWorklet,
  silenceEdgeHaptics,
  sliderProgress,
  snapPoints,
  width = SLIDER_WIDTH,
}: {
  nextTargetProgress: SliderProps['nextTargetProgress'];
  onProgressSettleWorklet: SliderProps['onProgressSettleWorklet'];
  silenceEdgeHaptics: SliderProps['silenceEdgeHaptics'];
  sliderProgress: SliderProps['progressValue'];
  snapPoints: SliderProps['snapPoints'];
  width?: number;
}) => {
  const { accentColors } = usePerpsAccentColorContext();

  return (
    <Slider
      progressValue={sliderProgress}
      colors={accentColors.slider}
      onProgressSettleWorklet={onProgressSettleWorklet}
      width={width}
      height={10}
      expandedHeight={14}
      nextTargetProgress={nextTargetProgress}
      silenceEdgeHaptics={silenceEdgeHaptics}
      snapPoints={snapPoints}
    />
  );
};

function leverageToProgress(leverage: number, maxLeverage: number): number {
  'worklet';
  if (maxLeverage === 1) return 0;
  return ((leverage - 1) / (maxLeverage - 1)) * SLIDER_MAX;
}

function progressToLeverage(progress: number, maxLeverage: number, nextTargetProgress: number | undefined): number {
  'worklet';
  if (maxLeverage === 1) return 1;

  let progressToUse = progress;
  if (nextTargetProgress !== undefined) {
    const shouldSnapToTarget = Math.abs(progress - nextTargetProgress) <= 0.5;
    if (shouldSnapToTarget) progressToUse = nextTargetProgress;
  }

  const normalized = progressToUse / SLIDER_MAX;
  // Map normalized [0, 1] to leverage [1, maxLeverage]
  const scaledValue = normalized * (maxLeverage - 1) + 1;
  return Math.min(maxLeverage, Math.max(1, Math.round(scaledValue)));
}

const MAX_INTERVALS = 7;
const NICE_INTERVALS = Object.freeze([2, 5, 10, 20]);

function buildSnapPoints(maxLeverage: number): readonly number[] {
  'worklet';
  if (maxLeverage < 10) {
    const leverageValues: number[] = [];
    for (let i = 1; i <= maxLeverage; i++) {
      leverageValues.push((i - 1) / (maxLeverage - 1));
    }
    return leverageValues;
  }

  const minInterval = Math.ceil((maxLeverage - 1) / MAX_INTERVALS);

  let interval = minInterval;
  for (const nice of NICE_INTERVALS) {
    if (nice >= minInterval) {
      interval = nice;
      break;
    }
  }

  // 1x leverage → snap point 0
  const snapPoints: number[] = [0];
  let current = interval;
  while (current < maxLeverage) {
    snapPoints.push((current - 1) / (maxLeverage - 1));
    current += interval;
  }
  // maxLeverage → snap point 1
  snapPoints.push(1);

  return snapPoints;
}

export const LeverageInputCard = memo(function LeverageInputCard({
  initialLeverage,
  leverage,
}: {
  initialLeverage: number;
  leverage: SharedValue<number>;
}) {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();

  const initialSliderProgress = useStableValue(() => getInitialSliderProgress(initialLeverage));
  const sliderProgress = useSharedValue(initialSliderProgress);
  const ignoreExternalUpdates = useSharedValue(false);
  const maxLeverage = useStoreSharedValue(useHlNewPositionStore, state => state.getMaxLeverage());
  const nextTargetProgress = useSharedValue<number | undefined>(initialSliderProgress);

  const leverageText = useDerivedValue(() => `${leverage.value}x`);
  const maxLeverageText = useDerivedValue(() => `${maxLeverage.value}x`);
  const snapPoints = useDerivedValue(() => buildSnapPoints(maxLeverage.value));

  const debouncedSetLeverage = useDebouncedCallback(
    (leverage: number) => {
      hlNewPositionStoreActions.setLeverage(leverage);
    },
    time.ms(200),
    { leading: false, trailing: true }
  );

  const resumeSliderUpdatesTimeout = useAnimatedTimeout({
    delayMs: time.ms(50),
    onTimeoutWorklet: () => {
      'worklet';
      ignoreExternalUpdates.value = false;
    },
  });

  useAnimatedReaction(
    () => progressToLeverage(sliderProgress.value, maxLeverage.value, nextTargetProgress.value),
    (newLeverage, previous) => {
      'worklet';
      if (previous === null || newLeverage === previous) return;

      leverage.value = newLeverage;

      const wasSetFromStore = ignoreExternalUpdates.value;
      if (wasSetFromStore) return;

      runOnJS(debouncedSetLeverage)(newLeverage);

      const currentProgress = sliderProgress.value;
      if (currentProgress < 0.5 || currentProgress >= SLIDER_MAX - 0.5) return;
      triggerHaptics('selection');
    },
    []
  );

  useListen(
    useHlNewPositionStore,
    state => state.leverage,
    newLeverage => {
      // Handle external leverage updates from the store
      if (newLeverage === null) return;
      runOnUI(() => {
        if (newLeverage === leverage.value) return;

        resumeSliderUpdatesTimeout.clearTimeout();
        ignoreExternalUpdates.value = true;
        leverage.value = newLeverage;

        const newProgress = leverageToProgress(newLeverage, maxLeverage.value);
        const shouldAnimate = newLeverage !== maxLeverage.value;

        if (!shouldAnimate) {
          sliderProgress.value = newProgress;
          resumeSliderUpdatesTimeout.start();
        } else {
          sliderProgress.value = withSpring(newProgress, SPRING_CONFIGS.snappyMediumSpringConfig, () => {
            ignoreExternalUpdates.value = false;
          });
        }
      })();
    }
  );

  const handleProgressSettle = useCallback<NonNullable<SliderProps['onProgressSettleWorklet']>>(
    (progress: number) => {
      'worklet';
      const newLeverage = progressToLeverage(progress, maxLeverage.value, undefined);
      runOnJS(debouncedSetLeverage)(newLeverage);
    },
    [debouncedSetLeverage, maxLeverage]
  );

  return (
    <Box
      alignItems="center"
      backgroundColor={accentColors.surfacePrimary}
      borderColor={{ custom: accentColors.opacity8 }}
      borderRadius={28}
      borderWidth={isDarkMode ? 2 : 0}
      gap={20}
      height={INPUT_CARD_HEIGHT}
      padding="20px"
      shadow="18px"
      width="full"
    >
      <Box width="full" flexDirection="row" alignItems="center">
        <Box gap={12}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {i18n.t(i18n.l.perps.leverage)}
          </Text>
          <Inline>
            <Text size="15pt" weight="bold" color="labelQuaternary">
              {`${i18n.t(i18n.l.perps.up_to)} `}
            </Text>
            <AnimatedText size="15pt" weight="heavy" color="labelSecondary">
              {maxLeverageText}
            </AnimatedText>
          </Inline>
        </Box>
        <AnimatedText style={{ flex: 1 }} align="right" size="30pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
          {leverageText}
        </AnimatedText>
      </Box>
      <LeverageSlider
        nextTargetProgress={nextTargetProgress}
        onProgressSettleWorklet={handleProgressSettle}
        silenceEdgeHaptics={ignoreExternalUpdates}
        sliderProgress={sliderProgress}
        snapPoints={snapPoints}
      />
    </Box>
  );
});

function getInitialSliderProgress(initialLeverage: number): number {
  const initialMaxLeverage = useHlNewPositionStore.getState().market?.maxLeverage ?? initialLeverage;
  const sliderProgress = leverageToProgress(initialLeverage, initialMaxLeverage);
  return sliderProgress;
}
