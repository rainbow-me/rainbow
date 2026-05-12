import React, { useEffect, useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { KeyboardAvoidingView, KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, { Extrapolation, FadeIn, FadeOut, interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PANEL_COLOR_DARK } from '@/components/SmoothPager/ListPanel';
import { Border, Box, ColorModeProvider, globalColors } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

import { CreatingStep } from './components/CreatingStep';
import { InfoInputStep } from './components/InfoInputStep';
import { PriceAndGasSync } from './components/PriceAndGasSync';
import { ReviewStep } from './components/ReviewStep';
import { ScreenBlurredImageBackground } from './components/ScreenBlurredImageBackground';
import { StepBlurredImageBackground } from './components/StepBlurredImageBackground';
import { StepBorderEffects } from './components/StepBorderEffects';
import { SuccessStep } from './components/SuccessStep';
import { FOOTER_HEIGHT, TokenLauncherFooter } from './components/TokenLauncherFooter';
import { TokenLauncherHeader } from './components/TokenLauncherHeader';
import { TokenLauncherContextProvider } from './context/TokenLauncherContext';
import { NavigationSteps, useTokenLauncherStore } from './state/tokenLauncherStore';

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
  const contentContainerHeight = screenHeight - footerHeight - (Platform.OS === 'android' ? 0 : safeAreaTop + safeAreaBottom);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [resetStore]);

  const isReviewStepVisible = useMemo(() => step === NavigationSteps.REVIEW || step === NavigationSteps.INFO, [step]);

  const stickyFooterKeyboardOffset = useMemo(
    () => ({ closed: 0, opened: Platform.OS === 'android' ? 0 : safeAreaBottom }),
    [safeAreaBottom]
  );

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

  const keyboardVerticalOffset = Platform.OS === 'android' ? FOOTER_HEIGHT + safeAreaBottom : FOOTER_HEIGHT;

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
            {/* TODO: This makes the start of the interactive keyboard dismissal start at the top of the sticky footer instead of the top of the keyboard, but there is some layout bug */}
            {/* <KeyboardGestureArea
              textInputNativeID={GHOST_INPUT_ACCESSORY_NATIVE_ID}
              style={{ flexGrow: 1 }}
              interpolator="ios"
              offset={keyboardVerticalOffset}
            > */}
            <InfoInputStep />
            {/* </KeyboardGestureArea> */}
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
        <TokenLauncherScreenContent />
        {/* This component returns null and syncs price plus gas-fee estimates used for prebuy balance validation. */}
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
      backgroundColor: Platform.OS === 'android' ? globalColors.grey100 : undefined,
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
