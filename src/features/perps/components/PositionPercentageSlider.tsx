import React, { memo, useCallback } from 'react';
import { AnimatedText, Box, Text, useColorMode } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { INPUT_CARD_HEIGHT, SLIDER_WIDTH } from '@/features/perps/constants';
import { SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { Slider } from '@/features/perps/components/Slider';
import * as i18n from '@/languages';

const PercentageSlider = ({
  sliderXPosition,
  onPercentageChange,
  onPercentageUpdate,
  width,
}: {
  sliderXPosition: SharedValue<number>;
  onPercentageChange?: (percentage: number) => void;
  onPercentageUpdate?: (percentage: number) => void;
  width: number;
}) => {
  const { accentColors } = usePerpsAccentColorContext();

  return (
    <Slider
      sliderXPosition={sliderXPosition}
      colors={accentColors.slider}
      onPercentageChange={onPercentageChange}
      onPercentageUpdate={onPercentageUpdate}
      width={width}
      height={10}
      expandedHeight={14}
    />
  );
};

type PositionPercentageSliderProps = {
  title: string;
  totalValue: string;
  percentageValue: SharedValue<number>;
  sliderWidth?: number;
};

export const PositionPercentageSlider = memo(function PositionPercentageSlider({
  title,
  totalValue,
  percentageValue,
  sliderWidth = SLIDER_WIDTH,
}: PositionPercentageSliderProps) {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const sliderXPosition = useSharedValue(percentageValue.value * sliderWidth);

  const displayValue = useDerivedValue(() => {
    return `${Math.round((sliderXPosition.value / sliderWidth) * 100)}%`;
  });

  const onPercentageChange = useCallback(
    (percentage: number) => {
      'worklet';
      const roundedPercentage = Math.round(percentage * 100);
      if (roundedPercentage !== Math.round(percentageValue.value * 100)) {
        percentageValue.value = percentage;
      }
    },
    [percentageValue]
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
              {` ${i18n.t(i18n.l.perps.positions.total)}`}
            </Text>
          </Text>
        </Box>
        <AnimatedText style={{ flex: 1 }} align="right" size="30pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
          {displayValue}
        </AnimatedText>
      </Box>
      <PercentageSlider
        onPercentageChange={onPercentageChange}
        onPercentageUpdate={onPercentageChange}
        sliderXPosition={sliderXPosition}
        width={sliderWidth}
      />
    </Box>
  );
});
