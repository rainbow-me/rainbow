import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedText, Bleed, Column, Columns, Inline, useColorMode, useForegroundColor } from '@/design-system';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { opacity } from '@/__swaps__/utils/swaps';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { pulsingConfig } from '@/__swaps__/screens/Swap/constants';
import { Slider, SliderProps, SliderVisualState, SLIDER_DEFAULT_WIDTH } from './Slider';

export type SliderLabels = {
  title?: string | SharedValue<string>;
  disabledText?: string;
  maxButtonText?: string;
};

export type SliderWithLabelsProps = SliderProps & {
  labels?: SliderLabels | SharedValue<SliderLabels>;
  formatPercentageWorklet?: (percentage: number, isEnabled: boolean) => string;
  onPressMaxWorklet?: () => void;
  showMaxButton?: boolean;
  showPercentage?: boolean;
  maxButtonColor?: string | SharedValue<string>;
  icon?: React.ReactNode;
  visualState?: SliderVisualState | SharedValue<SliderVisualState>;
  /**
   * Initial progress used when a shared value is not provided.
   */
};

export const SliderWithLabels: React.FC<SliderWithLabelsProps> = ({
  progressValue: externalProgressValue,
  initialProgress = 0,
  isEnabled: isEnabledProp = true,
  visualState: visualStateProp = 'idle',
  colors,
  height,
  width = SLIDER_DEFAULT_WIDTH,
  snapPoints,
  onGestureUpdateWorklet,
  onProgressSettleWorklet,
  gestureState,
  onGestureBeginWorklet,
  containerStyle,
  labels = {},
  showPercentage = true,
  formatPercentageWorklet,
  onPressMaxWorklet,
  showMaxButton = true,
  maxButtonColor,
  icon,
}) => {
  const { isDarkMode } = useColorMode();
  const maxButtonRef = useRef(undefined);

  const internalProgressValue = useSharedValue(initialProgress);
  const progressValue = externalProgressValue || internalProgressValue;

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

  // Format percentage text
  const percentageText = useDerivedValue(() => {
    if (!showPercentage) return '';

    if (!isEnabled.value) {
      return labelsValue.value.disabledText || 'Disabled';
    }

    if (formatPercentageWorklet) {
      return formatPercentageWorklet(progressValue.value, isEnabled.value);
    }

    return `${Math.round(progressValue.value)}%`;
  });

  const pulsingOpacity = useDerivedValue(() => {
    return visualState.value === 'processing'
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, SPRING_CONFIGS.sliderConfig);
  });

  const percentageTextStyle = useAnimatedStyle(() => {
    const isProcessing = visualState.value === 'processing';
    const useDimColor = !isEnabled.value || isProcessing || Math.round(progressValue.value) === 0;

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

  const handleMaxPress = useCallback(() => {
    'worklet';
    if (!isEnabled.value) return;

    if (onPressMaxWorklet) onPressMaxWorklet();
    progressValue.value = withSpring(100, SPRING_CONFIGS.snappySpringConfig, () => {
      'worklet';
      onProgressSettleWorklet?.(100, 'max-button');
    });
  }, [isEnabled, onPressMaxWorklet, onProgressSettleWorklet, progressValue]);

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
                  <AnimatedText color="labelSecondary" size="15pt" style={percentageTextStyle} weight="heavy">
                    {percentageText}
                  </AnimatedText>
                )}
              </Inline>
            </Inline>
            {showMaxButton && (
              <Column width="content">
                <GestureHandlerV1Button onPressWorklet={handleMaxPress} ref={maxButtonRef} style={{ margin: -12, padding: 12 }}>
                  <AnimatedText align="center" size="15pt" style={maxTextColor} weight="heavy">
                    {labelsValue.value.maxButtonText || 'Max'}
                  </AnimatedText>
                </GestureHandlerV1Button>
              </Column>
            )}
          </Columns>
        </View>
        <Slider
          progressValue={progressValue}
          initialProgress={initialProgress}
          isEnabled={isEnabledProp}
          colors={colors}
          height={height}
          expandedHeight={height}
          width={width}
          snapPoints={snapPoints}
          onGestureUpdateWorklet={onGestureUpdateWorklet}
          onProgressSettleWorklet={onProgressSettleWorklet}
          gestureState={gestureState}
          onGestureBeginWorklet={onGestureBeginWorklet}
        />
      </Animated.View>
    </Animated.View>
  );
};
