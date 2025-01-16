import React, { useEffect, useMemo } from 'react';
import { ExpandedAssetSheetContextProvider, useExpandedAssetSheetContext } from './context/ExpandedAssetSheetContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SheetContent } from './components/SheetContent';
import { SlackSheet } from '@/components/sheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { StatusBar } from 'react-native';
import { StatusBarHelper } from '@/helpers';
import { Box } from '@/design-system';
import { SHEET_FOOTER_HEIGHT, SheetFooter } from './components/SheetFooter';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { RootStackParamList } from '@/navigation/types';

function ExpandedAssetSheetContent() {
  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <>
      <SlackSheet
        backgroundColor={accentColors.background}
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
        bottomInset={SHEET_FOOTER_HEIGHT}
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
            style={{ backgroundColor: 'rgba(245, 248, 255, 0.3)', bottom: 0, alignSelf: 'center' }}
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

  useEffect(() => StatusBarHelper.setLightContent(), []);

  return (
    <ExpandedAssetSheetContextProvider asset={asset} address={address} chainId={chainId}>
      <ExpandedAssetSheetContent />
    </ExpandedAssetSheetContextProvider>
  );
}
