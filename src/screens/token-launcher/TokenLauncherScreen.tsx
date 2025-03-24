import React, { useEffect, useMemo } from 'react';
import { PANEL_COLOR_DARK } from '@/components/SmoothPager/ListPanel';
import { Border, Box, ColorModeProvider, globalColors } from '@/design-system';
import { FOOTER_HEIGHT, TokenLauncherFooter } from './components/TokenLauncherFooter';
import { TokenLauncherHeader } from './components/TokenLauncherHeader';
import { InfoInputStep } from './components/InfoInputStep';
import { ReviewStep } from './components/ReviewStep';
import { KeyboardAvoidingView, KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { NavigationSteps, useTokenLauncherStore } from './state/tokenLauncherStore';
import Animated, { Extrapolation, FadeIn, FadeOut, interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StepBlurredImageBackground } from './components/StepBlurredImageBackground';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { TokenLauncherContextProvider } from './context/TokenLauncherContext';
import { CreatingStep } from './components/CreatingStep';
import { Dimensions, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SuccessStep } from './components/SuccessStep';
import { ScreenBlurredImageBackground } from './components/ScreenBlurredImageBackground';
import { IS_ANDROID } from '@/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepBorderEffects } from './components/StepBorderEffects';
import { PriceAndGasSync } from './components/PriceAndGasSync';

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

const fadeInAnimation = FadeIn.duration(250);
const fadeOutAnimation = FadeOut.duration(250);

function TokenLauncherScreenContent() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
  const safeAreaInsets = useSafeAreaInsets();
  const safeAreaBottom = safeAreaInsets.bottom;
  const safeAreaTop = safeAreaInsets.top;

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

  const isReviewStepVisible = useMemo(() => step === NavigationSteps.REVIEW || step === NavigationSteps.INFO, [step]);

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

  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [1, 0], 'clamp'),
  }));

  const styles = useMemo(
    () =>
      getTokenLauncherStyles({
        animatedBorderStyle,
        contentContainerHeight,
        infoStepAnimatedStyle,
        reviewStepAnimatedStyle,
        safeAreaBottom,
        safeAreaTop,
        screenHeight,
        screenWidth,
      }),
    [
      animatedBorderStyle,
      contentContainerHeight,
      infoStepAnimatedStyle,
      reviewStepAnimatedStyle,
      safeAreaBottom,
      safeAreaTop,
      screenHeight,
      screenWidth,
    ]
  );

  return (
    <Box width="full" style={styles.containerStyle}>
      <Box borderRadius={42} style={styles.backgroundBlurStyle}>
        <ScreenBlurredImageBackground width={screenHeight} height={screenHeight} />
      </Box>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={keyboardVerticalOffset} style={styles.keyboardAvoidingViewStyle}>
        <Box backgroundColor={PANEL_COLOR_DARK} borderRadius={42} style={styles.contentContainerStyle}>
          <TokenLauncherHeader />
          <Animated.View style={styles.borderStyle}>
            <Border borderColor="separatorSecondary" borderRadius={42} borderWidth={THICK_BORDER_WIDTH} />
          </Animated.View>
          <Box style={styles.stepBlurredBackgroundStyle}>
            <StepBlurredImageBackground width={contentContainerHeight} height={contentContainerHeight} />
          </Box>
          <Box style={styles.borderEffectsStyle}>
            <StepBorderEffects width={screenWidth} height={contentContainerHeight} />
          </Box>
          <Animated.View style={styles.infoStepStyle}>
            <InfoInputStep />
          </Animated.View>
          {isReviewStepVisible && (
            <Animated.View exiting={reviewStepExitingAnimation} style={styles.reviewStepStyle}>
              <ReviewStep />
            </Animated.View>
          )}
          {step === NavigationSteps.CREATING && (
            <Animated.View entering={fadeInAnimation} exiting={fadeOutAnimation} style={styles.creatingStepStyle}>
              <CreatingStep />
            </Animated.View>
          )}
          {step === NavigationSteps.SUCCESS && (
            <Animated.View entering={fadeInAnimation} exiting={fadeOutAnimation} style={styles.successStepStyle}>
              <SuccessStep />
            </Animated.View>
          )}
        </Box>
      </KeyboardAvoidingView>
      <KeyboardStickyView offset={stickyFooterKeyboardOffset}>
        <TokenLauncherFooter />
      </KeyboardStickyView>
    </Box>
  );
}

export function TokenLauncherScreen() {
  return (
    <ColorModeProvider value="dark">
      <TokenLauncherContextProvider>
        <KeyboardProvider statusBarTranslucent={false} preserveEdgeToEdge={false} navigationBarTranslucent={false}>
          <TokenLauncherScreenContent />
        </KeyboardProvider>
        {/* This component returns null, and is just used to sync price and gas data */}
        <PriceAndGasSync />
      </TokenLauncherContextProvider>
    </ColorModeProvider>
  );
}

function getTokenLauncherStyles({
  animatedBorderStyle,
  contentContainerHeight,
  infoStepAnimatedStyle,
  reviewStepAnimatedStyle,
  safeAreaBottom,
  safeAreaTop,
  screenHeight,
  screenWidth,
}: {
  animatedBorderStyle: StyleProp<ViewStyle>;
  contentContainerHeight: number;
  infoStepAnimatedStyle: StyleProp<ViewStyle>;
  reviewStepAnimatedStyle: StyleProp<ViewStyle>;
  safeAreaBottom: number;
  safeAreaTop: number;
  screenHeight: number;
  screenWidth: number;
}): Record<string, StyleProp<ViewStyle>> {
  return {
    backgroundBlurStyle: [StyleSheet.absoluteFill, { left: -screenWidth / 2 }],
    borderEffectsStyle: [StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 3 }],
    borderStyle: [StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 100 }, animatedBorderStyle],
    containerStyle: {
      backgroundColor: IS_ANDROID ? globalColors.grey100 : undefined,
      flex: 1,
      height: screenHeight,
      paddingBottom: safeAreaBottom,
      paddingTop: safeAreaTop,
    },
    contentContainerStyle: {
      maxHeight: contentContainerHeight,
    },
    creatingStepStyle: {
      height: '100%',
      position: 'absolute',
      width: screenWidth,
      zIndex: 1,
    },
    infoStepStyle: [infoStepAnimatedStyle, { width: screenWidth }],
    keyboardAvoidingViewStyle: {
      flex: 1,
    },
    reviewStepStyle: [
      reviewStepAnimatedStyle,
      {
        height: '100%',
        position: 'absolute',
        width: screenWidth,
        zIndex: 1,
      },
    ],
    stepBlurredBackgroundStyle: [StyleSheet.absoluteFill, { left: -screenWidth / 2, pointerEvents: 'none' }],
    successStepStyle: {
      height: '100%',
      position: 'absolute',
      width: screenWidth,
      zIndex: 1,
    },
  };
}
