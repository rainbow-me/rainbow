import React, { useMemo } from 'react';
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
import { useAccountAsset, useAccountSettings } from '@/hooks';
import { convertStringToNumber, roundToSignificant1or5 } from '@/helpers/utilities';

const ANALYTICS_ROUTE_LOG_DELAY = 5 * 1000;

const DEFAULT_PERCENTAGES_OF_BALANCE = [0.025, 0.05, 0.1, 0.25, 0.5, 0.75];
// Ideally this would be different for different currencies, but that would need to be set in the remote config
const MINIMUM_NATIVE_CURRENCY_AMOUNT = 5;

export function SheetContent() {
  const { nativeCurrency } = useAccountSettings();
  const { accentColors, basicAsset: asset, isOwnedAsset } = useExpandedAssetSheetContext();

  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(asset.chainId));
  const buyWithAsset = useAccountAsset(nativeAssetForChain?.uniqueId ?? '', nativeCurrency);
  const assetIsBuyWithAsset = asset.uniqueId === buyWithAsset?.uniqueId;

  // These calculations are done here and not in the buy section because this determines if the buy section itself is visible
  const instantBuyNativeCurrencyAmounts = useMemo(() => {
    const buyWithAssetNativeBalance = buyWithAsset?.native?.balance?.amount;
    if (!buyWithAssetNativeBalance) return [];

    const buyWithAssetNativeBalanceNumber = convertStringToNumber(buyWithAssetNativeBalance);

    const amounts = new Set(
      DEFAULT_PERCENTAGES_OF_BALANCE.map(percentage => roundToSignificant1or5(percentage * buyWithAssetNativeBalanceNumber)).filter(
        amount => amount >= MINIMUM_NATIVE_CURRENCY_AMOUNT && amount < buyWithAssetNativeBalanceNumber
      )
    );
    return Array.from(amounts);
  }, [buyWithAsset]);

  const isBuySectionVisible = !assetIsBuyWithAsset && buyWithAsset && instantBuyNativeCurrencyAmounts.length > 0;

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
                content={<BuySection instantBuyAmounts={instantBuyNativeCurrencyAmounts} buyWithAsset={buyWithAsset} />}
                icon="􀋥"
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
