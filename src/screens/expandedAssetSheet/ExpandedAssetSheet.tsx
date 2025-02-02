import React from 'react';
import { ExpandedAssetSheetContextProvider, useExpandedAssetSheetContext } from './context/ExpandedAssetSheetContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SheetContent } from './components/SheetContent';
import { SlackSheet } from '@/components/sheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { StatusBar } from 'react-native';
import { Box, useColorMode } from '@/design-system';
import { SHEET_FOOTER_HEIGHT, SheetFooter } from './components/SheetFooter';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { RootStackParamList } from '@/navigation/types';
import { safeAreaInsetValues } from '@/utils';

const HANDLE_COLOR = 'rgba(245, 248, 255, 0.3)';
const LIGHT_HANDLE_COLOR = 'rgba(9, 17, 31, 0.3)';

function ExpandedAssetSheetContent() {
  const { isDarkMode } = useColorMode();
  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <>
      <SlackSheet
        backgroundColor={accentColors.background}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
        bottomInset={SHEET_FOOTER_HEIGHT}
        scrollIndicatorInsets={{
          bottom: safeAreaInsetValues.bottom + 32 + 46,
          top: safeAreaInsetValues.top + 32,
        }}
      >
        <SheetContent />
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={accentColors.background} height={75} width="full">
          <Box
            height={{ custom: 5 }}
            width={{ custom: 36 }}
            borderRadius={3}
            position="absolute"
            style={{ backgroundColor: isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR, bottom: 0, alignSelf: 'center' }}
          />
        </Box>
        <EasingGradient
          endColor={accentColors.background}
          startColor={accentColors.background}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 32, width: '100%', pointerEvents: 'none' }}
        />
      </Box>
      <SheetFooter />
    </>
  );
}

export function ExpandedAssetSheet() {
  const {
    params: { asset, address, chainId },
  } = useRoute<RouteProp<RootStackParamList, 'ExpandedAssetSheetV2'>>();

  return (
    <ExpandedAssetSheetContextProvider asset={asset} address={address} chainId={chainId}>
      <ExpandedAssetSheetContent />
    </ExpandedAssetSheetContextProvider>
  );
}
