import React, { useEffect } from 'react';
import { ExpandedAssetSheetContextProvider } from './context/ExpandedAssetSheetContext';
import { ParsedAddressAsset } from '@/entities';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SheetContent } from './components/SheetContent';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { colors } from '@/styles';
import { SlackSheet } from '@/components/sheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { StatusBar } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { StatusBarHelper } from '@/helpers';
import { Box, Cover } from '@/design-system';

export type ExpandedAssetSheetParams = {
  asset: ParsedAddressAsset;
};

type RouteParams = {
  ExpandedAssetSheetParams: ExpandedAssetSheetParams;
};

export function ExpandedAssetSheet() {
  const {
    params: { asset },
  } = useRoute<RouteProp<RouteParams, 'ExpandedAssetSheetParams'>>();

  const yPosition = useSharedValue(0);

  useEffect(() => StatusBarHelper.setLightContent(), []);

  return (
    <ExpandedAssetSheetContextProvider asset={asset}>
      <SlackSheet
        backgroundColor={asset.colors?.primary ?? colors.appleBlue}
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
        yPosition={yPosition}
      >
        <Box position="absolute" width="full" style={{ height: '200%', backgroundColor: 'rgba(0, 0, 0, 0.8)' }} />
        <Box
          height={{ custom: 5 }}
          width={{ custom: 36 }}
          borderRadius={3}
          position="absolute"
          style={{ backgroundColor: 'rgba(245, 248, 255, 0.3)', top: 63, alignSelf: 'center' }}
        />
        <SheetContent />
      </SlackSheet>
    </ExpandedAssetSheetContextProvider>
  );
}
