import React, { memo, useCallback } from 'react';
import { Box, Text } from '@/design-system';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { PERPS_COLORS } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import { fontWithWidth } from '@/styles/buildTextStyles';
import font from '@/styles/fonts';
import { StyleSheet, TextInput } from 'react-native';
import { SharedValue, useAnimatedProps, useAnimatedRef, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { Slider, SliderColors, SliderChangeSource } from '@/features/perps/components/Slider';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { divide, multiply } from '@/helpers/utilities';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { divWorklet } from '@/safe-math/SafeMath';

const SLIDER_HEIGHT = 14;
const SLIDER_WIDTH = DEVICE_WIDTH - 80;
const SLIDER_COLLAPSED_HEIGHT = 10;

const SizeSlider = ({
  sliderXPosition,
  onPercentageChange,
  onPercentageUpdate,
}: {
  sliderXPosition: SharedValue<number>;
  onPercentageChange: (percentage: number) => void;
  onPercentageUpdate?: (percentage: number) => void;
}) => {
  const { accentColors } = usePerpsAccentColorContext();
  // Required SharedValues for controlling the slider
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

  // Optional state indicators
  const isEnabled = useSharedValue(true);

  const handlePercentageChange = useCallback(
    (percentage: number, source: SliderChangeSource) => {
      console.log('percentage changed to:', percentage, 'from:', source);
      onPercentageChange(percentage);
    },
    [onPercentageChange]
  );

  const handleGestureUpdate = useCallback(
    (gestureState: { isAtMax: boolean; exceedsMax: boolean; position: number; percentage: number }) => {
      console.log('percentage updating to:', gestureState.percentage);
      onPercentageUpdate?.(gestureState.percentage);
    },
    [onPercentageUpdate]
  );

  const colors = useDerivedValue<SliderColors>(() => ({
    activeLeft: accentColors.opacity100,
    inactiveLeft: accentColors.opacity100,
    activeRight: opacityWorklet('#F5F8FF', 0.06),
    inactiveRight: opacityWorklet('#F5F8FF', 0.06),
  }));

  return (
    <Slider
      sliderXPosition={sliderXPosition}
      sliderPressProgress={sliderPressProgress}
      isEnabled={isEnabled}
      colors={colors}
      onPercentageChange={handlePercentageChange}
      onGestureUpdate={handleGestureUpdate}
      snapPoints={[0, 0.25, 0.5, 0.75, 1]}
      width={SLIDER_WIDTH}
      height={SLIDER_HEIGHT}
    />
  );
};

export const SizeInputCard = memo(function SizeInputCard() {
  const inputRef = useAnimatedRef<TextInput>();
  const { accentColors } = usePerpsAccentColorContext();
  const availableBalance = useHyperliquidAccountStore(state => state.balance);
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * 0.5); // Start at 50%

  const inputProps = useAnimatedProps(() => {
    // Start at 50% of the available balance, the same as the slider
    const initialValue = formatAssetPrice({ value: divWorklet(availableBalance, 2), currency: 'USD' }).replace('$', '');

    return {
      defaultValue: initialValue,
    };
  });

  const onChangeText = useCallback(
    (text: string) => {
      'worklet';
      const amount = parseFloat(text);

      if (isNaN(amount)) {
        sliderXPosition.value = withSpring(0, SPRING_CONFIGS.sliderConfig);
        return;
      }

      const percentage = divide(amount, availableBalance);
      const sliderX = multiply(percentage, SLIDER_WIDTH);
      sliderXPosition.value = withSpring(parseFloat(sliderX), SPRING_CONFIGS.sliderConfig);
    },
    [availableBalance, sliderXPosition]
  );

  return (
    <Box
      width="full"
      borderWidth={2}
      backgroundColor={PERPS_COLORS.surfacePrimary}
      borderColor={{ custom: accentColors.opacity6 }}
      borderRadius={28}
      padding={'20px'}
      alignItems="center"
    >
      <Box width="full" flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box gap={12}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {'Size'}
          </Text>
          <Text size="15pt" weight="heavy" color="labelSecondary">
            {formatAssetPrice({ value: availableBalance, currency: 'USD' })}
            <Text size="15pt" weight="bold" color="labelQuaternary">
              {' Available'}
            </Text>
          </Text>
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="flex-end" gap={2}>
          <Text size="30pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {'$'}
          </Text>
          <AnimatedInput
            animatedProps={inputProps}
            ref={inputRef}
            placeholder={'0'}
            inputMode={'decimal'}
            keyboardType={'decimal-pad'}
            onChangeText={onChangeText}
            style={[
              styles.input,
              {
                color: accentColors.opacity100,
              },
            ]}
          />
        </Box>
      </Box>
      <SizeSlider
        sliderXPosition={sliderXPosition}
        onPercentageChange={percentage => {
          'worklet';
          const amount = multiply(availableBalance, percentage);
          console.log('final amount', amount);
          inputRef.current?.setNativeProps({
            text: formatAssetPrice({ value: amount, currency: 'USD' }).replace('$', ''),
          });
        }}
        onPercentageUpdate={percentage => {
          'worklet';
          const amount = multiply(availableBalance, percentage);
          console.log('updating amount', amount);
          inputRef.current?.setNativeProps({
            text: formatAssetPrice({ value: amount, currency: 'USD' }).replace('$', ''),
          });
        }}
      />
    </Box>
  );
});

const styles = StyleSheet.create({
  input: {
    fontSize: 30,
    height: 48,
    // letterSpacing: 0.36,
    // marginRight: 7,
    // paddingLeft: 16,
    // paddingRight: 9,
    // paddingVertical: 10,
    // zIndex: 100,
    ...fontWithWidth(font.weight.heavy),
  },
});
