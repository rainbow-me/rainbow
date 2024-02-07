import React from 'react';
import Animated, { Easing, useAnimatedStyle, useDerivedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Box, Columns, useForegroundColor } from '@/design-system';
import { useDimensions } from '@/hooks';
import { magicMemo } from '@/utils';

const PULSE_STEP_DURATION = 1000;
const STEP_SPACING = 9;

type StepIndicatorProps = {
  steps: number; // 1 indexed
  currentStep: number; // set higher than `steps` to complete the animation
};

const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  const { width: screenWidth } = useDimensions();
  const stepWidth = screenWidth / steps - STEP_SPACING;
  const accentColor = useForegroundColor('accent');
  const accentColorTint = accentColor + '25';

  const pulseStepOpacity = useDerivedValue(() =>
    withRepeat(
      withSequence(
        withTiming(0, { duration: PULSE_STEP_DURATION }),
        withTiming(1, { duration: PULSE_STEP_DURATION }),
        withTiming(0, { duration: PULSE_STEP_DURATION })
      ),
      -1
    )
  );

  const pulseStepTranslate = useDerivedValue(() =>
    withRepeat(
      withSequence(
        withTiming(-stepWidth, { duration: PULSE_STEP_DURATION }),
        withTiming(-stepWidth, { duration: PULSE_STEP_DURATION }),
        withTiming(5, { duration: PULSE_STEP_DURATION })
      ),
      -1
    )
  );

  const finishedStepFill = useDerivedValue(() =>
    withSequence(
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }),
      withTiming(100, { duration: 300, easing: Easing.out(Easing.ease) })
    )
  );

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseStepOpacity?.value,
    transform: [{ translateX: pulseStepTranslate.value }],
  }));

  const animatedFinishedStyle = useAnimatedStyle(() => ({
    width: `${finishedStepFill?.value}%`,
  }));

  return (
    <Box padding="10px" width="full">
      <Columns space={{ custom: STEP_SPACING }}>
        {Array.from({ length: steps }).map((_, index) => {
          const stepIndex = index + 1;
          const isCurrentStep = stepIndex === currentStep;
          const isFinished = currentStep > stepIndex;
          const isPulsing = isCurrentStep && !isFinished;
          const isAnimatingFill = stepIndex === currentStep - 1 && isFinished;

          return (
            <Box
              borderRadius={16}
              height={{ custom: 4 }}
              key={index}
              style={{
                backgroundColor: accentColorTint,
                overflow: 'hidden',
              }}
              width="full"
            >
              {isPulsing ? (
                <Box
                  as={Animated.View}
                  borderRadius={16}
                  height={{ custom: 4 }}
                  style={[
                    {
                      backgroundColor: accentColor,
                      position: 'absolute',
                      width: '100%',
                    },
                    animatedPulseStyle,
                  ]}
                />
              ) : (
                <Box
                  as={Animated.View}
                  borderRadius={16}
                  height={{ custom: 4 }}
                  style={[
                    {
                      backgroundColor: accentColor,
                      position: 'absolute',
                      width: isFinished ? '100%' : '0%',
                    },
                    isAnimatingFill ? animatedFinishedStyle : null,
                  ]}
                />
              )}
            </Box>
          );
        })}
      </Columns>
    </Box>
  );
};

export default magicMemo(StepIndicator, ['steps', 'currentStep']);
