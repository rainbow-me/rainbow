import React from 'react';
import * as i18n from '@/languages';
import { SectionId, useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { AccentColorProvider, Bleed, Box, ColorModeProvider, Separator, Stack } from '@/design-system';
import { CollapsibleSection, LAYOUT_ANIMATION } from './shared/CollapsibleSection';
import Animated from 'react-native-reanimated';
import { AboutSection, BalanceSection, BuySection, MarketStatsSection, ChartSection } from './sections';
import { SHEET_FOOTER_HEIGHT } from './SheetFooter';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { analyticsV2 } from '@/analytics';
import { useTimeoutEffect } from '@/hooks/useTimeout';

const ANALYTICS_ROUTE_LOG_DELAY = 5 * 1000;

export function SheetContent() {
  const { accentColors, basicAsset: asset, isOwnedAsset } = useExpandedAssetSheetContext();

  const chainId = asset.chainId;
  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));
  const buySectionPayWithAsset = nativeAssetForChain;
  const assetIsBuySectionPayWithAsset = asset.uniqueId === buySectionPayWithAsset?.uniqueId;
  const isBuySectionVisible = !assetIsBuySectionPayWithAsset;

  useTimeoutEffect(
    ({ elapsedTime }) => {
      const { address, chainId, symbol, name, icon_url, price } = asset;
      analyticsV2.track(analyticsV2.event.tokenDetailsErc20, {
        eventSentAfterMs: elapsedTime,
        token: {
          address,
          chainId,
          symbol,
          name,
          icon_url,
          price: price?.value,
        },
        available_data: {
          // TODO:
          chart: true,
          description: false,
          iconUrl: !!icon_url,
        },
      });
    },
    { timeout: ANALYTICS_ROUTE_LOG_DELAY }
  );

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
            <CollapsibleSection
              content={<MarketStatsSection />}
              icon="􀑃"
              id={SectionId.MARKET_STATS}
              primaryText={i18n.t(i18n.l.expanded_state.sections.market_stats.title)}
            />
            {isBuySectionVisible && (
              <CollapsibleSection
                content={<BuySection />}
                icon="􀋥"
                id={SectionId.BUY}
                primaryText={i18n.t(i18n.l.expanded_state.sections.buy.title)}
                secondaryText={asset.symbol}
              />
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
