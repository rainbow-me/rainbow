import React, { useEffect, useMemo } from 'react';
import { Box, ColorModeProvider } from '@/design-system';
import { FOOTER_HEIGHT, TokenLauncherFooter } from './components/TokenLauncherFooter';
import { TokenLauncherHeader } from './components/TokenLauncherHeader';
import { InfoInputStep } from './components/InfoInputStep';
import { ReviewStep } from './components/ReviewStep';
import { KeyboardAvoidingView, KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { NavigationSteps, useTokenLauncherStore } from './state/tokenLauncherStore';
import Animated, { Extrapolation, FadeIn, interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StepBlurredImageBackground } from './components/StepBlurredImageBackground';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { TokenLauncherContextProvider, useTokenLauncherContext } from './context/TokenLauncherContext';
import { CreatingStep } from './components/CreatingStep';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { SuccessStep } from './components/SuccessStep';
import { JumboBlurredImageBackground } from './components/JumboBlurredImageBackground';
import { IS_ANDROID } from '@/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepBorderEffects } from './components/StepBorderEffects';

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

function TokenLauncherScreenContent() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const safeAreaBottom = safeAreaInsets.bottom;
  const safeAreaTop = safeAreaInsets.top;

  const { tokenImage } = useTokenLauncherContext();
  const stepAnimatedSharedValue = useTokenLauncherStore(state => state.stepAnimatedSharedValue);
  const resetStore = useTokenLauncherStore(state => state.reset);
  const step = useTokenLauncherStore(state => state.step);

  const footerHeight = FOOTER_HEIGHT + (step === NavigationSteps.SUCCESS ? 42 : 0);
  const contentContainerHeight = screenHeight - footerHeight - (IS_ANDROID ? 0 : safeAreaTop + safeAreaBottom);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);

  const stickyFooterKeyboardOffset = useMemo(() => ({ closed: 0, opened: IS_ANDROID ? 0 : safeAreaBottom }), [safeAreaBottom]);

  const infoStepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          stepAnimatedSharedValue.value,
          [NavigationSteps.INFO, NavigationSteps.REVIEW],
          [0, -screenWidth],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const reviewStepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          stepAnimatedSharedValue.value,
          [NavigationSteps.INFO, NavigationSteps.REVIEW],
          [screenWidth, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const keyboardVerticalOffset = IS_ANDROID ? FOOTER_HEIGHT + safeAreaBottom : FOOTER_HEIGHT;

  return (
    <>
      <Box style={[StyleSheet.absoluteFill, { left: -screenWidth / 2 }]}>
        <JumboBlurredImageBackground width={941} height={941} />
      </Box>
      <Box
        width="full"
        backgroundColor={tokenImage ? 'transparent' : '#000'}
        style={{ flex: 1, height: screenHeight, paddingBottom: safeAreaBottom, paddingTop: safeAreaTop }}
      >
        <KeyboardAvoidingView behavior={'padding'} keyboardVerticalOffset={keyboardVerticalOffset} style={{ flex: 1 }}>
          <Box
            borderWidth={THICK_BORDER_WIDTH}
            borderColor={'separatorSecondary'}
            background="surfacePrimary"
            borderRadius={42}
            style={{ maxHeight: contentContainerHeight }}
          >
            <Box style={[StyleSheet.absoluteFill, { left: -screenWidth / 2 }]}>
              <StepBlurredImageBackground width={contentContainerHeight} height={contentContainerHeight} />
            </Box>
            <Box style={StyleSheet.absoluteFill}>
              <StepBorderEffects width={screenWidth} height={contentContainerHeight} />
            </Box>
            <Animated.View style={[infoStepAnimatedStyle, { width: screenWidth }]}>
              <InfoInputStep />
            </Animated.View>
            {(step === NavigationSteps.REVIEW || step === NavigationSteps.INFO) && (
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
            {step === NavigationSteps.CREATING && (
              <Animated.View
                entering={FadeIn.duration(250)}
                style={{ width: screenWidth, height: '100%', position: 'absolute', zIndex: 1 }}
              >
                <CreatingStep />
              </Animated.View>
            )}
            {step === NavigationSteps.SUCCESS && (
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
    </>
  );
}

export function TokenLauncherScreen() {
  return (
    <ColorModeProvider value="dark">
      <TokenLauncherContextProvider>
        <KeyboardProvider statusBarTranslucent={false} preserveEdgeToEdge={false} navigationBarTranslucent={false}>
          <TokenLauncherScreenContent />
        </KeyboardProvider>
      </TokenLauncherContextProvider>
    </ColorModeProvider>
  );
}
