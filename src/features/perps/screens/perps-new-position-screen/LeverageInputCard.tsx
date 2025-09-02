import React, { memo, useCallback } from 'react';
import { AnimatedText, Box, Text } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { PERPS_COLORS } from '@/features/perps/constants';
import { runOnJS, SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { Slider, SliderColors } from '@/features/perps/components/Slider';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { PerpMarket } from '@/features/perps/types';
import { useListen } from '@/state/internal/hooks/useListen';

const SLIDER_WIDTH = DEVICE_WIDTH - 80;

const LeverageSlider = ({
  sliderXPosition,
  onPercentageUpdate,
}: {
  sliderXPosition: SharedValue<number>;
  onPercentageUpdate: (percentage: number) => void;
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
      snapPoints={[0, 0.25, 0.5, 0.75, 1]}
      width={SLIDER_WIDTH}
      height={10}
      expandedHeight={14}
    />
  );
};

export const LeverageInputCard = memo(function LeverageInputCard({ market }: { market: PerpMarket }) {
  const { accentColors } = usePerpsAccentColorContext();
  const maxLeverage = market.maxLeverage;
  const initialLeverage = useHlNewPositionStore.getState().leverage ?? 1;

  const leverage = useSharedValue(initialLeverage);
  const sliderXPosition = useSharedValue((initialLeverage / maxLeverage) * SLIDER_WIDTH);
  const leverageText = useDerivedValue(() => {
    return `${leverage.value}x`;
  });

  // Initialize the leverage with the account setting leverage
  useListen(
    useHlNewPositionStore,
    state => state.leverage,
    (newLeverage, oldLeverage) => {
      if (oldLeverage === null && newLeverage !== null) {
        leverage.value = newLeverage;
        sliderXPosition.value = (newLeverage / maxLeverage) * SLIDER_WIDTH;
      }
    }
  );

  const setLeverage = useCallback((leverage: number) => {
    hlNewPositionStoreActions.setLeverage(leverage);
  }, []);

  const onPercentageUpdate = useCallback(
    (percentage: number) => {
      'worklet';
      const newLeverage = Math.round(percentage * maxLeverage) || 1;
      if (newLeverage !== leverage.value) {
        leverage.value = newLeverage;
        triggerHaptics('soft');
        runOnJS(setLeverage)(newLeverage);
      }
    },
    [maxLeverage, leverage, setLeverage]
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
            {'Leverage'}
          </Text>
          <Text size="15pt" weight="bold" color="labelQuaternary">
            {'Up to '}
            <Text size="15pt" weight="heavy" color="labelSecondary">
              {`${maxLeverage}x`}
            </Text>
          </Text>
        </Box>
        <AnimatedText style={{ flex: 1 }} align="right" size="30pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
          {leverageText}
        </AnimatedText>
      </Box>
      <LeverageSlider sliderXPosition={sliderXPosition} onPercentageUpdate={onPercentageUpdate} />
    </Box>
  );
});
