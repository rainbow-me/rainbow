import React, { memo, useCallback } from 'react';
import { AnimatedText, Box, Text, useColorMode } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { INPUT_CARD_HEIGHT, SLIDER_WIDTH } from '@/features/perps/constants';
import i18n from '@/languages';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Slider, SliderChangeSource } from '@/features/perps/components/Slider';

const ProgressSlider = ({
  progressValue,
  onProgressSettleWorklet,
  width,
}: {
  progressValue: SharedValue<number>;
  onProgressSettleWorklet?: (progress: number, source: SliderChangeSource) => void;
  width: number;
}) => {
  const { accentColors } = usePerpsAccentColorContext();

  return (
    <Slider
      progressValue={progressValue}
      colors={accentColors.slider}
      onProgressSettleWorklet={onProgressSettleWorklet}
      width={width}
      height={10}
      expandedHeight={14}
    />
  );
};

type PositionPercentageSliderProps = {
  title: string;
  totalValue: string;
  progressValue: SharedValue<number>;
  sliderWidth?: number;
};

export const PositionPercentageSlider = memo(function PositionPercentageSlider({
  title,
  totalValue,
  progressValue,
  sliderWidth = SLIDER_WIDTH,
}: PositionPercentageSliderProps) {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();

  const displayValue = useDerivedValue(() => {
    return `${Math.round(progressValue.value)}%`;
  });

  const handleProgressSettle = useCallback(
    (progress: number) => {
      'worklet';
      const rounded = Math.round(progress);
      if (rounded !== Math.round(progressValue.value)) {
        progressValue.value = rounded;
      }
    },
    [progressValue]
  );

  return (
    <Box
      width="full"
      borderWidth={isDarkMode ? 2 : 0}
      backgroundColor={isDarkMode ? accentColors.surfacePrimary : 'white'}
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
            {title}
          </Text>
          <Text size="15pt" weight="heavy" color="labelSecondary">
            {totalValue}
            <Text size="15pt" weight="bold" color="labelQuaternary">
              {` ${i18n.perps.positions.total()}`}
            </Text>
          </Text>
        </Box>
        <AnimatedText style={{ flex: 1 }} align="right" size="30pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
          {displayValue}
        </AnimatedText>
      </Box>
      <ProgressSlider progressValue={progressValue} onProgressSettleWorklet={handleProgressSettle} width={sliderWidth} />
    </Box>
  );
});
