import React, { useMemo } from 'react';
import { Box, ColorModeProvider, useBackgroundColor, useColorMode } from '@/design-system';
import { FOOTER_HEIGHT, TokenLauncherFooter } from './components/TokenLauncherFooter';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { TokenLauncherHeader } from './components/TokenLauncherHeader';
import { InfoInputStep } from './components/InfoInputStep';
import { ReviewStep } from './components/ReviewStep';
import { KeyboardAvoidingView, KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useTokenLauncherStore } from './state/tokenLauncherStore';
import Animated, { Extrapolation, FadeIn, interpolate, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SkiaBackground } from './components/SkiaBackground';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { TokenLauncherContextProvider } from './context/TokenLauncherContext';
import { CreatingStep } from './components/CreatingStep';
import { StyleSheet } from 'react-native';
import { SuccessStep } from './components/SuccessStep';

function reviewStepExitingAnimation() {
  'worklet';
  const fullDuration = 250;
  const animations = {
    opacity: withTiming(0, { duration: fullDuration * 0.9 }),
    transform: [{ scale: withTiming(0.96, { duration: fullDuration }) }, { translateY: withTiming(25, { duration: fullDuration }) }],
  };
  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }, { translateY: 0 }],
  };
  return {
    initialValues,
    animations,
  };
}

export function TokenLauncherScreen() {
  const backgroundColor = '#000';

  const stepIndex = useTokenLauncherStore(state => state.stepIndex);
  const step = useTokenLauncherStore(state => state.step);

  const screenWidth = deviceUtils.dimensions.width;
  const contentContainerHeight = deviceUtils.dimensions.height - safeAreaInsetValues.top - safeAreaInsetValues.bottom - FOOTER_HEIGHT;

  const stickyFooterKeyboardOffset = useMemo(() => ({ closed: 0, opened: safeAreaInsetValues.bottom }), []);

  const infoStepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(stepIndex.value, [0, 1], [0, -screenWidth], Extrapolation.CLAMP) }],
  }));

  const reviewStepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(stepIndex.value, [0, 1], [screenWidth, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <ColorModeProvider value="dark">
      <TokenLauncherContextProvider>
        <KeyboardProvider>
          <Box
            width="full"
            backgroundColor={backgroundColor}
            style={{ flex: 1, paddingBottom: safeAreaInsetValues.bottom, paddingTop: safeAreaInsetValues.top }}
          >
            <KeyboardAvoidingView behavior={'padding'} keyboardVerticalOffset={FOOTER_HEIGHT} style={{ flex: 1 }}>
              <Box
                borderWidth={THICK_BORDER_WIDTH}
                borderColor={{ custom: 'rgba(245, 248, 255, 0.06)' }}
                background="surfacePrimary"
                borderRadius={42}
                style={{ maxHeight: contentContainerHeight }}
              >
                <Box style={StyleSheet.absoluteFill}>
                  <SkiaBackground width={screenWidth} height={contentContainerHeight} />
                </Box>
                <Animated.View style={[infoStepAnimatedStyle, { width: screenWidth }]}>
                  <InfoInputStep />
                </Animated.View>
                {(step === 'review' || step === 'info') && (
                  <Animated.View
                    exiting={reviewStepExitingAnimation}
                    style={[
                      reviewStepAnimatedStyle,
                      {
                        // required to prevent the keyboard avoidance from breaking
                        position: 'absolute',
                        width: screenWidth,
                        height: '100%',
                        // required for exiting animation to work
                        zIndex: 1,
                      },
                    ]}
                  >
                    <ReviewStep />
                  </Animated.View>
                )}
                {step === 'creating' && (
                  <Animated.View
                    entering={FadeIn.duration(250)}
                    style={{ width: screenWidth, height: '100%', position: 'absolute', zIndex: 1 }}
                  >
                    <CreatingStep />
                  </Animated.View>
                )}
                {step === 'success' && (
                  <Animated.View
                    entering={FadeIn.duration(250)}
                    style={{ width: screenWidth, height: '100%', position: 'absolute', zIndex: 1 }}
                  >
                    <SuccessStep />
                  </Animated.View>
                )}
                <TokenLauncherHeader />
              </Box>
            </KeyboardAvoidingView>
            <KeyboardStickyView offset={stickyFooterKeyboardOffset}>
              <TokenLauncherFooter />
            </KeyboardStickyView>
          </Box>
        </KeyboardProvider>
      </TokenLauncherContextProvider>
    </ColorModeProvider>
  );
}
