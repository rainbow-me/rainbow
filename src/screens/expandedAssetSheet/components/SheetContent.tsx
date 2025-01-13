import React from 'react';
import { SectionId, useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { AccentColorProvider, Bleed, Box, ColorModeProvider, Separator, Stack } from '@/design-system';
import { CollapsibleSection, LAYOUT_ANIMATION } from './shared/CollapsibleSection';
import Animated from 'react-native-reanimated';
import { AboutSection, BalanceSection, BuySection, MarketStatsSection, ChartSection } from './sections';
import { SHEET_FOOTER_HEIGHT } from './SheetFooter';
import { useUserAssetsStore } from '@/state/assets/userAssets';

export function SheetContent() {
  const { accentColors, asset, isOwnedAsset } = useExpandedAssetSheetContext();

  const chainId = asset.chainId;
  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));
  const buySectionPayWithAsset = nativeAssetForChain;
  const assetIsBuySectionPayWithAsset = asset.uniqueId === buySectionPayWithAsset?.uniqueId;
  const isBuySectionVisible = !assetIsBuySectionPayWithAsset;

  return (
    <AccentColorProvider color={accentColors.opacity100}>
      <ColorModeProvider value="dark">
        <Box
          height="full"
          width="full"
          paddingTop={{ custom: 96 }}
          paddingBottom={{ custom: SHEET_FOOTER_HEIGHT }}
          paddingHorizontal="24px"
        >
          <Bleed horizontal={'24px'}>
            <ChartSection />
          </Bleed>
          <Stack
            space="28px"
            separator={
              <Animated.View layout={LAYOUT_ANIMATION}>
                <Separator color={{ custom: 'rgba(245, 248, 255, 0.03)' }} thickness={1} />
              </Animated.View>
            }
          >
            {isOwnedAsset && (
              <Animated.View layout={LAYOUT_ANIMATION}>
                <BalanceSection />
              </Animated.View>
            )}
            <CollapsibleSection content={<MarketStatsSection />} icon="􀑃" id={SectionId.MARKET_STATS} primaryText="Market Stats" />
            {isBuySectionVisible && (
              <CollapsibleSection content={<BuySection />} icon="􀋥" id={SectionId.BUY} primaryText="Buy" secondaryText={asset.symbol} />
            )}
            {/* Backlogged */}
            {/* {isOwnedAsset && (
              <CollapsibleSection content={<BridgeSection />} icon="􁾫" id={SectionId.BRIDGE} primaryText="Bridge" secondaryText={'to'} />
            )} */}
            <CollapsibleSection content={<AboutSection />} icon="􁜾" id={SectionId.ABOUT} primaryText="About" />
          </Stack>
        </Box>
      </ColorModeProvider>
    </AccentColorProvider>
  );
}
