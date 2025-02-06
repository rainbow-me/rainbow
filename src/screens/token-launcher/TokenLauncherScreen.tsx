import React, { useMemo } from 'react';
import { Box } from '@/design-system';
import { TOKEN_PREVIEW_BAR_HEIGHT, TokenPreviewBar } from './components/TokenPreviewBar';
import { deviceUtils, safeAreaInsetValues } from '@/utils';

import { TokenLauncherHeader } from './components/TokenLauncherHeader';
import { InfoInputStep } from './components/InfoInputStep';
import { OverviewStep } from './components/OverviewStep';
import { KeyboardAvoidingView, KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useTokenLauncherStore } from './state/tokenLauncherStore';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { SkiaBackground } from './components/SkiaBackground';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

export function TokenLauncherScreen() {
  const stepIndex = useTokenLauncherStore(state => state.stepIndex);

  const screenWidth = deviceUtils.dimensions.width;

  const contentContainerHeight =
    deviceUtils.dimensions.height - safeAreaInsetValues.top - safeAreaInsetValues.bottom - TOKEN_PREVIEW_BAR_HEIGHT;

  const stickyFooterKeyboardOffset = useMemo(() => ({ closed: 0, opened: safeAreaInsetValues.bottom }), []);

  const infoStepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(stepIndex.value, [0, 1], [0, -screenWidth], Extrapolation.CLAMP) }],
  }));

  const overviewStepAnimatedStyle = useAnimatedStyle(() => ({
    // required to prevent the keyboard avoidance from breaking
    position: 'absolute',
    transform: [{ translateX: interpolate(stepIndex.value, [0, 1], [screenWidth, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <KeyboardProvider>
      <Box
        width="full"
        backgroundColor="black"
        style={{ flex: 1, paddingBottom: safeAreaInsetValues.bottom, paddingTop: safeAreaInsetValues.top }}
      >
        <KeyboardAvoidingView behavior={'padding'} keyboardVerticalOffset={TOKEN_PREVIEW_BAR_HEIGHT} style={{ flex: 1 }}>
          <Box
            borderWidth={THICK_BORDER_WIDTH}
            borderColor={{ custom: 'rgba(245, 248, 255, 0.06)' }}
            background="surfacePrimary"
            borderRadius={42}
            style={{ maxHeight: contentContainerHeight }}
          >
            <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <SkiaBackground width={screenWidth} height={contentContainerHeight} />
            </Box>
            <Animated.View style={[infoStepAnimatedStyle, { width: screenWidth }]}>
              <InfoInputStep />
            </Animated.View>
            <Animated.View style={[overviewStepAnimatedStyle, { width: screenWidth }]}>
              <OverviewStep />
            </Animated.View>
            <TokenLauncherHeader />
          </Box>
        </KeyboardAvoidingView>
        <KeyboardStickyView offset={stickyFooterKeyboardOffset}>
          <TokenPreviewBar />
        </KeyboardStickyView>
      </Box>
    </KeyboardProvider>
  );
}
