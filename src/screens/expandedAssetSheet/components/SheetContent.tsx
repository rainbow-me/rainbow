import React from 'react';
import { useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { AccentColorProvider, Box, ColorModeProvider, useColorMode } from '@/design-system';
import { AboutSection, BalanceSection, BuySection, MarketStatsSection, ChartSection, ClaimSection, HistorySection } from './sections';
import { SHEET_FOOTER_HEIGHT } from './SheetFooter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Placement } from './sections/BuySection';
import { NameAndLogoSection } from './sections/NameAndLogoSection';

export function SheetContent() {
  const { colorMode } = useColorMode();
  const { accentColors } = useExpandedAssetSheetContext();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <AccentColorProvider color={accentColors.color}>
      <ColorModeProvider value={colorMode}>
        <Box
          height="full"
          width="full"
          paddingTop={{ custom: 96 }}
          paddingBottom={{ custom: SHEET_FOOTER_HEIGHT + safeAreaInsets.bottom }}
          paddingHorizontal="24px"
        >
          <Box gap={32}>
            <Box gap={20}>
              <NameAndLogoSection />
              <ChartSection />
            </Box>
            <Box gap={28}>
              <BalanceSection />
              <BuySection placement={Placement.AFTER_BALANCE} />
              <ClaimSection />
              <MarketStatsSection />
              <BuySection placement={Placement.AFTER_MARKET_STATS} />
              {/* BACKLOGGED */}
              {/* {isOwnedAsset && (
              <CollapsibleSection content={<BridgeSection />} icon="􁾫" id={SectionId.BRIDGE} primaryText="Bridge" secondaryText={'to'} />
            )} */}
              <HistorySection />
              <AboutSection />
            </Box>
          </Box>
        </Box>
      </ColorModeProvider>
    </AccentColorProvider>
  );
}
