import { Box, ColorModeProvider, Text } from '@/design-system';
import React from 'react';
import { CollapsibleSection } from './components/CollapsibleSection';
import { ExpandedAssetSheetContextProvider, SectionId } from './context/ExpandedAssetSheetContext';
import { ParsedAddressAsset } from '@/entities';
import { RouteProp, useRoute } from '@react-navigation/native';

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

  return (
    <ExpandedAssetSheetContextProvider asset={asset}>
      <ColorModeProvider value="dark">
        <Box height="full" width="full" style={{ backgroundColor: asset.colors?.primary }}>
          <Box
            height="full"
            width="full"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            paddingTop={{ custom: 200 }}
            paddingHorizontal="24px"
          >
            <CollapsibleSection
              content={
                <Box height={{ custom: 100 }} background="blue">
                  <Text weight="heavy" align="center" size="17pt" color="label">
                    Hi
                  </Text>
                </Box>
              }
              icon="􀋥"
              id={SectionId.PROFIT}
              primaryText="Buy"
              secondaryText="ETH"
            />
            <CollapsibleSection
              content={
                <Text weight="heavy" align="center" size="17pt" color="label">
                  Hi
                </Text>
              }
              icon="􀋥"
              id={SectionId.MARKET_STATS}
              primaryText="Buy"
              secondaryText="ETH"
            />
          </Box>
        </Box>
      </ColorModeProvider>
    </ExpandedAssetSheetContextProvider>
  );
}
