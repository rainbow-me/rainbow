import { Box, Text } from '@/design-system';
import React from 'react';
import { CollapsibleSection } from './components/CollapsibleSection';
import { ExpandedAssetSheetContextProvider, SectionId } from './context/ExpandedAssetSheetContext';

export function ExpandedAssetSheet() {
  return (
    <ExpandedAssetSheetContextProvider>
      <Box height="full" width="full" paddingTop={{ custom: 200 }} paddingHorizontal="24px" background="surfacePrimary">
        <CollapsibleSection
          accentColor="#FFC0CB"
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
          accentColor="#FFC0CB"
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
    </ExpandedAssetSheetContextProvider>
  );
}
