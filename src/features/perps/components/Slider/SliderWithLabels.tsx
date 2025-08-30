import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { pulsingConfig } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Bleed, Column, Columns, Inline, useColorMode, useForegroundColor } from '@/design-system';
import { SCRUBBER_WIDTH } from '@/features/perps/constants';
import React, { useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Slider, SliderProps, SliderVisualState } from './Slider';

export interface SliderLabels {
  title?: string | SharedValue<string>;
  disabledText?: string;
  maxButtonText?: string;
}

export interface SliderWithLabelsProps extends SliderProps {
  labels?: SliderLabels | SharedValue<SliderLabels>;
  showPercentage?: boolean;
  percentageFormatter?: (percentage: number, isEnabled: boolean) => string;
  onMaxPress?: () => void;
  showMaxButton?: boolean;
  maxButtonColor?: string | SharedValue<string>;
  icon?: React.ReactNode;
  visualState?: SliderVisualState | SharedValue<SliderVisualState>;
}

export const SliderWithLabels: React.FC<SliderWithLabelsProps> = ({
  sliderXPosition,
  sliderPressProgress,
  isEnabled: isEnabledProp = true,
  visualState: visualStateProp = 'idle',
  colors,
  height,
  width,
  snapPoints,
  onPercentageChangeWorklet,
  onGestureStart,
  onGestureEnd,
  onGestureUpdateWorklet,
  onGestureFinalize,
  checkExceedsMax,
  onExceedsMax,
  containerStyle,
  labels = {},
  showPercentage = true,
  percentageFormatter,
  onMaxPress,
  showMaxButton = true,
  maxButtonColor,
  icon,
}) => {
  const { isDarkMode } = useColorMode();
  const maxButtonRef = useRef(undefined);

  const labelSecondary = useForegroundColor('labelSecondary');
  const zeroAmountColor = opacity(labelSecondary, 0.2);

  // Handle both SharedValue and regular props
  const isEnabled = useDerivedValue(() => {
    if (typeof isEnabledProp === 'boolean') return isEnabledProp;
    return isEnabledProp.value;
  });

  const visualState = useDerivedValue(() => {
    if (typeof visualStateProp === 'string') return visualStateProp;
    return visualStateProp.value;
  });

  // Handle both SharedValue and regular labels
  const labelsValue = useDerivedValue(() => {
    if (!labels) return {};
    if ('value' in labels) return labels.value;
    return labels;
  });

  // Calculate percentage from slider position
  const xPercentage = useDerivedValue(() => {
    const sliderWidth = width ?? 0;
    return Math.max(0, Math.min(1, (sliderXPosition.value - SCRUBBER_WIDTH / sliderWidth) / sliderWidth));
  });

  // Format percentage text
  const percentageText = useDerivedValue(() => {
    if (!showPercentage) return '';

    if (!isEnabled.value) {
      return labelsValue.value.disabledText || 'Disabled';
    }

    if (percentageFormatter) {
      return percentageFormatter(xPercentage.value, isEnabled.value);
    }

    return `${Math.round(xPercentage.value * 100)}%`;
  });

  const pulsingOpacity = useDerivedValue(() => {
    return visualState.value === 'processing'
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, SPRING_CONFIGS.sliderConfig);
  });

  const percentageTextStyle = useAnimatedStyle(() => {
    const isProcessing = visualState.value === 'processing';
    const useDimColor = !isEnabled.value || isProcessing || sliderXPosition.value === 0;

    return {
      color: withTiming(useDimColor ? zeroAmountColor : labelSecondary, TIMING_CONFIGS.slowFadeConfig),
      opacity: isProcessing ? pulsingOpacity.value : withSpring(1, SPRING_CONFIGS.sliderConfig),
    };
  });

  const maxTextColor = useAnimatedStyle(() => {
    if (maxButtonColor) {
      const color = typeof maxButtonColor === 'string' ? maxButtonColor : maxButtonColor.value;
      return { color };
    }
    return { color: isEnabled.value ? labelSecondary : zeroAmountColor };
  });

  const titleLabelStyle = useAnimatedStyle(() => ({ marginRight: isEnabled.value ? 3 : 0 }));

  const handleMaxPress = () => {
    'worklet';
    if (!isEnabled.value) return;

    sliderXPosition.value = withSpring(width ?? 0, SPRING_CONFIGS.snappySpringConfig);

    if (onMaxPress) {
      runOnJS(onMaxPress)();
    }
    onPercentageChangeWorklet(1, 'max-button');
  };

  return (
    <Animated.View style={containerStyle}>
      <Animated.View style={{ gap: 14 }}>
        <View style={{ zIndex: 10 }}>
          <Columns alignHorizontal="justify" alignVertical="center">
            <Inline alignVertical="center" space="6px" wrap={false}>
              {icon && <Bleed vertical="4px">{icon}</Bleed>}
              <Inline alignVertical="bottom" wrap={false}>
                {labelsValue.value.title && (
                  <AnimatedText color={isDarkMode ? 'labelQuaternary' : 'labelTertiary'} size="15pt" style={titleLabelStyle} weight="bold">
                    {labelsValue.value.title}
                  </AnimatedText>
                )}
                {showPercentage && (
                  <AnimatedText color="labelSecondary" size="15pt" style={percentageTextStyle} weight="heavy" tabularNumbers>
                    {percentageText}
                  </AnimatedText>
                )}
              </Inline>
            </Inline>
            {showMaxButton && (
              <Column width="content">
                <GestureHandlerV1Button onPressWorklet={handleMaxPress} ref={maxButtonRef} style={{ margin: -12, padding: 12 }}>
                  <AnimatedText align="center" size="15pt" style={maxTextColor} weight="heavy">
                    {labelsValue.value.maxButtonText || 'MAX'}
                  </AnimatedText>
                </GestureHandlerV1Button>
              </Column>
            )}
          </Columns>
        </View>
        <Slider
          sliderXPosition={sliderXPosition}
          sliderPressProgress={sliderPressProgress}
          isEnabled={isEnabledProp}
          colors={colors}
          height={height}
          width={width}
          snapPoints={snapPoints}
          onPercentageChangeWorklet={onPercentageChangeWorklet}
          onGestureStart={onGestureStart}
          onGestureEnd={onGestureEnd}
          onGestureUpdateWorklet={onGestureUpdateWorklet}
          onGestureFinalize={onGestureFinalize}
          checkExceedsMax={checkExceedsMax}
          onExceedsMax={onExceedsMax}
        />
      </Animated.View>
    </Animated.View>
  );
};
