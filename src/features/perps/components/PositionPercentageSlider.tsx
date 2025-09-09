import React, { memo, useCallback } from 'react';
import { AnimatedText, Box, Text } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { PERPS_COLORS, SLIDER_WIDTH } from '@/features/perps/constants';
import { SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { Slider, SliderColors } from '@/features/perps/components/Slider';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { triggerHaptics } from 'react-native-turbo-haptics';

const PercentageSlider = ({
  sliderXPosition,
  onPercentageUpdate,
  width,
}: {
  sliderXPosition: SharedValue<number>;
  onPercentageUpdate: (percentage: number) => void;
  width: number;
}) => {
  const { accentColors } = usePerpsAccentColorContext();

  const colors = useDerivedValue<SliderColors>(() => ({
    activeLeft: accentColors.opacity100,
    inactiveLeft: accentColors.opacity100,
    activeRight: opacityWorklet('#F5F8FF', 0.06),
    inactiveRight: opacityWorklet('#F5F8FF', 0.06),
  }));

  return (
    <Slider
      sliderXPosition={sliderXPosition}
      colors={colors}
      onPercentageUpdate={onPercentageUpdate}
      onPercentageChange={onPercentageUpdate}
      snapPoints={[0, 0.25, 0.5, 0.75, 1]}
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
  const { accentColors } = usePerpsAccentColorContext();
  const sliderXPosition = useSharedValue(percentageValue.value * sliderWidth);

  const displayValue = useDerivedValue(() => {
    return `${Math.round(percentageValue.value * 100)}%`;
  });

  const onPercentageUpdate = useCallback(
    (percentage: number) => {
      'worklet';
      const roundedPercentage = Math.round(percentage * 100);
      if (roundedPercentage !== Math.round(percentageValue.value * 100)) {
        percentageValue.value = percentage;
        triggerHaptics('soft');
      }
    },
    [percentageValue]
  );

  return (
    <Box
      width="full"
      borderWidth={2}
      backgroundColor={PERPS_COLORS.surfacePrimary}
      borderColor={{ custom: accentColors.opacity8 }}
      borderRadius={28}
      padding={'20px'}
      alignItems="center"
      gap={20}
    >
      <Box width="full" flexDirection="row" alignItems="center">
        <Box gap={12}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {title}
          </Text>
          <Text size="15pt" weight="heavy" color="labelSecondary">
            {totalValue}
            <Text size="15pt" weight="bold" color="labelQuaternary">
              {' Total'}
            </Text>
          </Text>
        </Box>
        <AnimatedText style={{ flex: 1 }} align="right" size="30pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
          {displayValue}
        </AnimatedText>
      </Box>
      <PercentageSlider sliderXPosition={sliderXPosition} onPercentageUpdate={onPercentageUpdate} width={sliderWidth} />
    </Box>
  );
});
