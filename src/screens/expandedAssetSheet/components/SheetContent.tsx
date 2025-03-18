import React, { useState } from 'react';
import * as i18n from '@/languages';
import { SectionId, useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { AccentColorProvider, Bleed, Box, ColorModeProvider, Separator, Stack, useColorMode } from '@/design-system';
import { CollapsibleSection, LAYOUT_ANIMATION } from './shared/CollapsibleSection';
import Animated from 'react-native-reanimated';
import { AboutSection, BalanceSection, BuySection, MarketStatsSection, ChartSection, ClaimSection } from './sections';
import { SHEET_FOOTER_HEIGHT } from './SheetFooter';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useAccountAsset, useAccountSettings } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';

const SEPARATOR_COLOR = 'rgba(245, 248, 255, 0.025)';
const LIGHT_SEPARATOR_COLOR = 'rgba(9, 17, 31, 0.025)';

export function SheetContent() {
  const { nativeCurrency } = useAccountSettings();
  const { colorMode, isDarkMode } = useColorMode();
  const { accentColors, basicAsset: asset, hideClaimSection, isOwnedAsset } = useExpandedAssetSheetContext();
  const safeAreaInsets = useSafeAreaInsets();

  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(asset.chainId));
  const buyWithAsset = useAccountAsset(nativeAssetForChain?.uniqueId ?? '', nativeCurrency);
  const assetIsBuyWithAsset = asset.uniqueId === buyWithAsset?.uniqueId;

  const isBuySectionVisible = !assetIsBuyWithAsset && buyWithAsset;
  const [claimable] = useState(() => (hideClaimSection ? null : useAirdropsStore.getState().getClaimable(asset.uniqueId)));

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
          <Bleed horizontal={'24px'}>
            <ChartSection />
          </Bleed>
          <Stack
            space="28px"
            separator={
              <Animated.View layout={LAYOUT_ANIMATION}>
                <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} thickness={1} />
              </Animated.View>
            }
          >
            {isOwnedAsset && (
              <Animated.View layout={LAYOUT_ANIMATION}>
                <BalanceSection />
              </Animated.View>
            )}
            {claimable && (
              <CollapsibleSection
                content={<ClaimSection claimable={claimable} />}
                icon="􀑉"
                id={SectionId.CLAIM}
                primaryText={i18n.t(i18n.l.expanded_state.sections.claim.title)}
              />
            )}
            <CollapsibleSection
              content={<MarketStatsSection />}
              icon="􀑃"
              id={SectionId.MARKET_STATS}
              primaryText={i18n.t(i18n.l.expanded_state.sections.market_stats.title)}
            />
            {isBuySectionVisible && (
              <CollapsibleSection
                content={<BuySection />}
                icon="􀡓"
                id={SectionId.BUY}
                primaryText={i18n.t(i18n.l.expanded_state.sections.buy.title)}
                secondaryText={asset.symbol}
              />
            )}
            {/* BACKLOGGED */}
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
