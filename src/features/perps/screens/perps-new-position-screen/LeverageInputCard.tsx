import React, { memo, useCallback } from 'react';
import { AnimatedText, Box, Inline, Text, useColorMode } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { INPUT_CARD_HEIGHT, SLIDER_WIDTH } from '@/features/perps/constants';
import { runOnJS, runOnUI, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { Slider, SliderProps } from '@/features/perps/components/Slider';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { useAnimatedTimeout } from '@/hooks/reanimated/useAnimatedTimeout';
import { useListen } from '@/state/internal/hooks/useListen';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useDebouncedCallback } from 'use-debounce';
import { time } from '@/utils/time';

const LeverageSlider = ({
  onPercentageChange,
  onPercentageUpdate,
  silenceEdgeHaptics,
  sliderXPosition,
}: Pick<SliderProps, 'onPercentageChange' | 'onPercentageUpdate' | 'silenceEdgeHaptics' | 'sliderXPosition'>) => {
  const { accentColors } = usePerpsAccentColorContext();

  return (
    <Slider
      sliderXPosition={sliderXPosition}
      colors={accentColors.slider}
      onPercentageChange={onPercentageChange}
      onPercentageUpdate={onPercentageUpdate}
      width={SLIDER_WIDTH}
      height={10}
      expandedHeight={14}
      silenceEdgeHaptics={silenceEdgeHaptics}
    />
  );
};

export const LeverageInputCard = memo(function LeverageInputCard() {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();

  const initialLeverage = hlNewPositionStoreActions.getLeverage() ?? 1;
  const initialMaxLeverage = useHlNewPositionStore.getState().market?.maxLeverage ?? initialLeverage;

  const ignoreSliderUpdates = useSharedValue(false);
  const leverage = useSharedValue(initialLeverage);
  const maxLeverage = useStoreSharedValue(useHlNewPositionStore, state => state.getMaxLeverage());
  const sliderXPosition = useSharedValue((initialLeverage / initialMaxLeverage) * SLIDER_WIDTH);
  const maxLeverageText = useDerivedValue(() => `${maxLeverage.value}x`);

  const leverageText = useDerivedValue(() => {
    const percentage = sliderXPosition.value / SLIDER_WIDTH;
    const leverageToNearestTenth = Math.round(maxLeverage.value * percentage * 10) / 10;
    return `${Math.max(Math.round(leverageToNearestTenth), 1)}x`;
  });

  const resumeSliderUpdatesTimeout = useAnimatedTimeout({
    delayMs: time.ms(50),
    onTimeoutWorklet: () => {
      'worklet';
      ignoreSliderUpdates.value = false;
    },
  });

  // Initialize the leverage with the account setting leverage
  useListen(
    useHlNewPositionStore,
    state => state.leverage,
    newLeverage => {
      if (newLeverage === null) return;
      runOnUI(() => {
        if (newLeverage === leverage.value) return;
        resumeSliderUpdatesTimeout.clearTimeout();
        ignoreSliderUpdates.value = true;
        leverage.value = newLeverage;

        const shouldAnimate = newLeverage !== maxLeverage.value;

        if (!shouldAnimate) {
          const newSliderXPosition = (newLeverage / maxLeverage.value) * SLIDER_WIDTH;
          sliderXPosition.value = newSliderXPosition;
          resumeSliderUpdatesTimeout.start();
        } else {
          sliderXPosition.value = withSpring(
            (newLeverage / maxLeverage.value) * SLIDER_WIDTH,
            SPRING_CONFIGS.snappyMediumSpringConfig,
            () => (ignoreSliderUpdates.value = false)
          );
        }
      })();
    }
  );

  const debouncedSetLeverage = useDebouncedCallback(
    (leverage: number) => {
      hlNewPositionStoreActions.setLeverage(leverage);
    },
    time.ms(200),
    { leading: false, trailing: true }
  );

  const onPercentageChange = useCallback(
    (percentage: number) => {
      'worklet';
      if (ignoreSliderUpdates.value) return;
      const newLeverage = Math.round(percentage * maxLeverage.value) || 1;
      if (newLeverage !== leverage.value) leverage.value = newLeverage;
      runOnJS(debouncedSetLeverage)(newLeverage);
    },
    [debouncedSetLeverage, ignoreSliderUpdates, leverage, maxLeverage]
  );

  const onPercentageUpdate = useCallback(
    (percentage: number) => {
      'worklet';
      if (ignoreSliderUpdates.value) return;
      const newLeverage = Math.round(percentage * maxLeverage.value) || 1;
      if (newLeverage === leverage.value) return;
      leverage.value = newLeverage;
      runOnJS(debouncedSetLeverage)(newLeverage);
    },
    [debouncedSetLeverage, ignoreSliderUpdates, maxLeverage, leverage]
  );

  return (
    <Box
      width="full"
      borderWidth={isDarkMode ? 2 : 0}
      backgroundColor={accentColors.surfacePrimary}
      borderColor={{ custom: accentColors.opacity8 }}
      borderRadius={28}
      padding={'20px'}
      alignItems="center"
      gap={20}
      height={INPUT_CARD_HEIGHT}
      shadow={'18px'}
    >
      <Box width="full" flexDirection="row" alignItems="center">
        <Box gap={12}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {'Leverage'}
          </Text>
          <Inline>
            <Text size="15pt" weight="bold" color="labelQuaternary">
              {'Up to '}
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
        onPercentageChange={onPercentageChange}
        onPercentageUpdate={onPercentageUpdate}
        silenceEdgeHaptics={ignoreSliderUpdates}
        sliderXPosition={sliderXPosition}
      />
    </Box>
  );
});
