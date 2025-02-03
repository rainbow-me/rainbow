import React, { useMemo } from 'react';
import { Box } from '@/design-system';
import { TOKEN_PREVIEW_BAR_HEIGHT, TokenPreviewBar } from './components/TokenPreviewBar';
import { deviceUtils, safeAreaInsetValues } from '@/utils';

import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { TokenLauncherHeader } from './components/TokenLauncherHeader';
import { InfoInputStep } from './components/InfoInputStep';
import { OverviewStep } from './components/OverviewStep';
import { KeyboardAvoidingView, KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { BlurredImageBackground } from './components/BlurBackground';

export function TokenLauncherScreen() {
  const isInfoInputStep = true;
  const isOverviewStep = false;

  const contentContainerHeight =
    deviceUtils.dimensions.height - safeAreaInsetValues.top - safeAreaInsetValues.bottom - TOKEN_PREVIEW_BAR_HEIGHT;

  const stickyFooterKeyboardOffset = useMemo(() => ({ closed: 0, opened: safeAreaInsetValues.bottom }), []);

  return (
    <KeyboardProvider>
      <Box
        width="full"
        backgroundColor="black"
        style={{ flex: 1, paddingBottom: safeAreaInsetValues.bottom, paddingTop: safeAreaInsetValues.top }}
      >
        <KeyboardAvoidingView behavior={'padding'} keyboardVerticalOffset={TOKEN_PREVIEW_BAR_HEIGHT} style={{ flex: 1 }}>
          <Box borderWidth={THICK_BORDER_WIDTH} background="surfacePrimary" borderRadius={42} style={{ maxHeight: contentContainerHeight }}>
            <BlurredImageBackground />
            {isInfoInputStep && <InfoInputStep />}
            {isOverviewStep && <OverviewStep />}
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
