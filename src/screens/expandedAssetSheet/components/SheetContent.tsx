import React from 'react';
import { SectionId, useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { AccentColorProvider, Box, ColorModeProvider, Separator, Stack, Text } from '@/design-system';
import { CollapsibleSection } from './CollapsibleSection';
import { BuySectionContent } from './sectionContent/BuySectionContent';

export function SheetContent() {
  const { accentColors, asset } = useExpandedAssetSheetContext();
  return (
    <AccentColorProvider color={accentColors.opacity100}>
      <Box height="full" width="full" background="accent">
        <ColorModeProvider value="dark">
          <Box
            height="full"
            width="full"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            paddingTop={{ custom: 200 }}
            paddingHorizontal="24px"
          >
            <Stack space="28px" separator={<Separator color={{ custom: 'rgba(245, 248, 255, 0.03)' }} thickness={1} />}>
              <CollapsibleSection
                content={
                  <Box background="blue">
                    <Text weight="heavy" align="center" size="17pt" color="label">
                      fdsfdsfdsfdsfdsfdsafeasfds
                    </Text>
                    <Text weight="heavy" align="center" size="17pt" color="label">
                      fdsfdsfdsfdsfdsfdsafeasfds
                    </Text>
                    <Text weight="heavy" align="center" size="17pt" color="label">
                      fdsfdsfdsfdsfdsfdsafeasfds
                    </Text>
                    <Text weight="heavy" align="center" size="17pt" color="label">
                      fdsfdsfdsfdsfdsfdsafeasfds
                    </Text>
                  </Box>
                }
                icon="􀋥"
                id={SectionId.PROFIT}
                primaryText="Buy"
                secondaryText="ETH"
              />
              <CollapsibleSection
                content={<BuySectionContent />}
                icon="􀋥"
                id={SectionId.MARKET_STATS}
                primaryText="Buy"
                secondaryText={asset.symbol}
              />
            </Stack>
          </Box>
        </ColorModeProvider>
      </Box>
    </AccentColorProvider>
  );
}
