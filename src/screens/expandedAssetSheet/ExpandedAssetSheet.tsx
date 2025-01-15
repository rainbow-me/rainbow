import React, { useEffect, useMemo } from 'react';
import { ExpandedAssetSheetContextProvider } from './context/ExpandedAssetSheetContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SheetContent } from './components/SheetContent';
import { colors } from '@/styles';
import { SlackSheet } from '@/components/sheet';
import { IS_ANDROID, IS_IOS } from '@/env';
import { StatusBar } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { StatusBarHelper } from '@/helpers';
import { Box } from '@/design-system';
import { SheetFooter } from './components/SheetFooter';
import chroma from 'chroma-js';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { RootStackParamList } from '@/navigation/types';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

export function ExpandedAssetSheet() {
  const {
    params: { asset, address, chainId },
  } = useRoute<RouteProp<RootStackParamList, 'ExpandedAssetSheetV2'>>();

  const yPosition = useSharedValue(0);

  useEffect(() => StatusBarHelper.setLightContent(), []);

  // TODO: remove this by wrapping children such that they have access to the context
  const backgroundColor = useMemo(() => {
    const assetColor = asset.colors?.primary ?? colors.appleBlue;
    return chroma(
      chroma(assetColor)
        .rgb()
        .map(channel => Math.round(channel * (1 - 0.8) + 0 * 0.8))
    ).css();
  }, [asset.colors?.primary]);

  return (
    <ExpandedAssetSheetContextProvider asset={asset} address={address} chainId={chainId}>
      <SlackSheet
        backgroundColor={backgroundColor}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
        yPosition={yPosition}
      >
        <SheetContent />
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={backgroundColor} height={75} width="full">
          <Box
            height={{ custom: 5 }}
            width={{ custom: 36 }}
            borderRadius={3}
            position="absolute"
            style={{ backgroundColor: 'rgba(245, 248, 255, 0.3)', bottom: 0, alignSelf: 'center' }}
          />
        </Box>
        <EasingGradient
          endColor={backgroundColor}
          startColor={backgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 30, width: '100%', pointerEvents: 'none' }}
        />
      </Box>
      <SheetFooter />
    </ExpandedAssetSheetContextProvider>
  );
}
