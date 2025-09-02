import React from 'react';
import * as i18n from '@/languages';
import { useDerivedValue } from 'react-native-reanimated';
import { useColorMode, useForegroundColor } from '@/design-system';
import { greaterThanWorklet } from '@/safe-math/SafeMath';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { getColorValueForThemeWorklet, opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { AnimatedSwapCoinIcon } from '../AnimatedSwapCoinIcon';
import { SliderColors, SliderChangeSource, SliderVisualState, SliderWithLabels, SliderLabels } from '@/features/perps/components/Slider';

type GenericSwapSliderProps = {
  dualColor?: boolean;
  height?: number;
  snapPoints?: number[];
  width?: number;
};

const SWAP_TITLE_LABEL = i18n.t(i18n.l.swap.modal_types.swap);
const BRIDGE_TITLE_LABEL = i18n.t(i18n.l.swap.modal_types.bridge);
const MAX_LABEL = i18n.t(i18n.l.swap.max);
const NO_BALANCE_LABEL = i18n.t(i18n.l.swap.no_balance);

export const GenericSwapSlider = ({ dualColor, height, snapPoints, width }: GenericSwapSliderProps) => {
  const { isDarkMode } = useColorMode();
  const {
    AnimatedSwapStyles,
    SwapInputController: { inputMethod, inputValues, onChangedPercentage, quoteFetchingInterval, setValueToMaxSwappableAmount },
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
    sliderPressProgress,
    sliderXPosition,
    swapInfo,
  } = useSwapContext();

  const fillSecondary = useForegroundColor('fillSecondary');
  const labelSecondary = useForegroundColor('labelSecondary');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const zeroAmountColor = opacity(labelSecondary, 0.2);

  // Derive if slider is enabled (has balance)
  const isEnabled = useDerivedValue(() => {
    return !!internalSelectedInputAsset.value && greaterThanWorklet(internalSelectedInputAsset.value.maxSwappableAmount || 0, 0);
  });

  // Convert isQuoteStale to visual state
  const visualState = useDerivedValue<SliderVisualState>(() => {
    return isQuoteStale.value === 1 ? 'processing' : 'idle';
  });

  // Derive colors from swap assets
  const colors = useDerivedValue<SliderColors>(() => ({
    inactiveLeft: opacityWorklet(
      dualColor
        ? getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode)
        : getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode),
      0.9
    ),
    activeLeft: dualColor
      ? getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode)
      : getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode),
    inactiveRight: dualColor
      ? opacityWorklet(getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode), 0.9)
      : separatorSecondary,
    activeRight: dualColor ? getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode) : fillSecondary,
  }));

  // Derive labels
  const labels = useDerivedValue<SliderLabels>(() => ({
    title: isEnabled.value ? (swapInfo.value.isBridging ? BRIDGE_TITLE_LABEL : SWAP_TITLE_LABEL) : '',
    disabledText: NO_BALANCE_LABEL,
    maxButtonText: MAX_LABEL,
  }));

  // Derive max button color
  const maxButtonColor = useDerivedValue(() =>
    isEnabled.value ? getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode) : zeroAmountColor
  );

  // Custom percentage formatter for swap context
  const percentageFormatter = (percentage: number, enabled: boolean) => {
    'worklet';
    return enabled ? `${Math.round(percentage * 100)}%` : NO_BALANCE_LABEL;
  };

  // Check if exceeds max swappable
  const checkExceedsMax = () => {
    'worklet';
    const currentInputValue = inputValues.value.inputAmount;
    const maxSwappableAmount = internalSelectedInputAsset.value?.maxSwappableAmount;
    return maxSwappableAmount ? greaterThanWorklet(currentInputValue, maxSwappableAmount) : false;
  };

  // Handle percentage change with source tracking
  const handlePercentageChange = (percentage: number, source: SliderChangeSource) => {
    // Update input method based on source
    if (source === 'gesture' || source === 'tap') {
      inputMethod.value = 'slider';
    } else if (source === 'max-button') {
      // Keep as slider for max button since it's still a slider-based interaction
      inputMethod.value = 'slider';
    }
    onChangedPercentage(percentage);
  };

  // Handle max button press
  const handleMaxPress = () => {
    setValueToMaxSwappableAmount();
  };

  // Enhanced gesture callbacks
  const handleGestureStart = (state: { position: number; percentage: number }) => {
    quoteFetchingInterval.stop();
    // Set pending state when starting gesture
    if (state.position > 0) {
      isQuoteStale.value = 1;
    }
  };

  const handleGestureEnd = (state: { position: number; percentage: number; hasChanged: boolean }) => {
    // Clear pending state if slider moved to 0
    if (state.percentage < 0.005) {
      isQuoteStale.value = 0;
      isFetching.value = false;
    }
  };

  const handleGestureFinalize = (state: { hasChanged: boolean }) => {
    // Start polling if gesture ended without change
    if (!state.hasChanged) {
      quoteFetchingInterval.start();
    }
  };

  return (
    <SliderWithLabels
      sliderXPosition={sliderXPosition}
      sliderPressProgress={sliderPressProgress}
      isEnabled={isEnabled}
      visualState={visualState}
      colors={colors}
      labels={labels}
      height={height}
      width={width}
      snapPoints={snapPoints}
      showPercentage={true}
      percentageFormatter={percentageFormatter}
      onPercentageChange={handlePercentageChange}
      onMaxPress={handleMaxPress}
      showMaxButton={true}
      maxButtonColor={maxButtonColor}
      icon={<AnimatedSwapCoinIcon showBadge={false} asset={internalSelectedInputAsset} size={16} />}
      containerStyle={AnimatedSwapStyles.hideWhileReviewingOrConfiguringGas}
      onGestureStart={handleGestureStart}
      onGestureEnd={handleGestureEnd}
      onGestureFinalize={handleGestureFinalize}
      checkExceedsMax={checkExceedsMax}
    />
  );
};
