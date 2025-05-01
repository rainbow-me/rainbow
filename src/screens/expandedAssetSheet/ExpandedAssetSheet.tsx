import React from 'react';
import { ExpandedAssetSheetContextProvider, useExpandedAssetSheetContext } from './context/ExpandedAssetSheetContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SheetContent } from './components/SheetContent';
import { SlackSheet } from '@/components/sheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { Box, useColorMode } from '@/design-system';
import { SheetFooter } from './components/SheetFooter';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { RootStackParamList } from '@/navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Routes from '@/navigation/routesNames';

const HANDLE_COLOR = 'rgba(245, 248, 255, 0.3)';
const LIGHT_HANDLE_COLOR = 'rgba(9, 17, 31, 0.3)';

function ExpandedAssetSheetContent() {
  const { isDarkMode } = useColorMode();
  const { accentColors } = useExpandedAssetSheetContext();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <>
      <SlackSheet
        backgroundColor={accentColors.background}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        showsVerticalScrollIndicator={false}
        additionalTopPadding={false}
        scrollIndicatorInsets={{
          bottom: safeAreaInsets.bottom,
          top: safeAreaInsets.top + 32,
        }}
      >
        <SheetContent />
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={accentColors.background} height={safeAreaInsets.top + (IS_ANDROID ? 24 : 12)} width="full">
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
    params: { asset, address, chainId, hideClaimSection = false },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.EXPANDED_ASSET_SHEET_V2>>();

  return (
    <ExpandedAssetSheetContextProvider asset={asset} address={address} chainId={chainId} hideClaimSection={hideClaimSection}>
      <ExpandedAssetSheetContent />
    </ExpandedAssetSheetContextProvider>
  );
}
