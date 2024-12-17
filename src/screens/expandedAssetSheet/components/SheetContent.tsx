import React from 'react';
import { SectionId, useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { AccentColorProvider, Box, ColorModeProvider, Separator, Stack } from '@/design-system';
import { CollapsibleSection, LAYOUT_ANIMATION } from './shared/CollapsibleSection';
import Animated from 'react-native-reanimated';
import { BalanceSection, BuySection } from './sections';

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
            <Stack
              space="28px"
              separator={
                <Animated.View layout={LAYOUT_ANIMATION}>
                  <Separator color={{ custom: 'rgba(245, 248, 255, 0.03)' }} thickness={1} />
                </Animated.View>
              }
            >
              <BalanceSection />
              <CollapsibleSection content={<BuySection />} icon="􀋥" id={SectionId.BRIDGE} primaryText="Buy" secondaryText={asset.symbol} />
              <CollapsibleSection content={<BuySection />} icon="􀋥" id={SectionId.BUY} primaryText="Buy" secondaryText={asset.symbol} />
            </Stack>
          </Box>
        </ColorModeProvider>
      </Box>
    </AccentColorProvider>
  );
}
