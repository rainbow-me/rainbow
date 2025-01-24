import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { SectionId, useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { AccentColorProvider, Bleed, Box, ColorModeProvider, Separator, Stack, useColorMode } from '@/design-system';
import { CollapsibleSection, LAYOUT_ANIMATION } from './shared/CollapsibleSection';
import Animated from 'react-native-reanimated';
import { AboutSection, BalanceSection, BuySection, MarketStatsSection, ChartSection } from './sections';
import { SHEET_FOOTER_HEIGHT } from './SheetFooter';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useAccountAsset, useAccountSettings } from '@/hooks';
import { convertStringToNumber, roundToSignificant1or5 } from '@/helpers/utilities';
import { IS_DEV } from '@/env';
import isTestFlight from '@/helpers/isTestFlight';

const SEPARATOR_COLOR = 'rgba(245, 248, 255, 0.03)';
const LIGHT_SEPARATOR_COLOR = 'rgba(9, 17, 31, 0.03)';

const DEFAULT_PERCENTAGES_OF_BALANCE = [0.05, 0.1, 0.25, 0.5, 0.75];
// Ideally this would be different for different currencies, but that would need to be set in the remote config
let minimumNativeCurrencyAmount = IS_DEV || isTestFlight ? 1 : 10;

export function SheetContent() {
  const { nativeCurrency } = useAccountSettings();
  const { colorMode, isDarkMode } = useColorMode();
  const { accentColors, basicAsset: asset, isOwnedAsset } = useExpandedAssetSheetContext();

  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(asset.chainId));
  const buyWithAsset = useAccountAsset(nativeAssetForChain?.uniqueId ?? '', nativeCurrency);
  const assetIsBuyWithAsset = asset.uniqueId === buyWithAsset?.uniqueId;

  // These calculations are done here and not in the buy section because this determines if the buy section itself is visible
  const instantBuyNativeCurrencyAmounts = useMemo(() => {
    const buyWithAssetNativeBalance = buyWithAsset?.native?.balance?.amount;
    if (!buyWithAssetNativeBalance) return [];

    const buyWithAssetNativeBalanceNumber = convertStringToNumber(buyWithAssetNativeBalance);

    // Eth is the only native currency where 10 is not a reasonable default minimum amount
    if (nativeCurrency === 'ETH') {
      minimumNativeCurrencyAmount = 0.01;
    }

    const amounts = new Set(
      DEFAULT_PERCENTAGES_OF_BALANCE.map(percentage => roundToSignificant1or5(percentage * buyWithAssetNativeBalanceNumber)).filter(
        amount => amount >= minimumNativeCurrencyAmount && amount < buyWithAssetNativeBalanceNumber
      )
    );
    return Array.from(amounts);
  }, [buyWithAsset]);

  const isBuySectionVisible = !assetIsBuyWithAsset && buyWithAsset && instantBuyNativeCurrencyAmounts.length > 0;

  return (
    <AccentColorProvider color={accentColors.color}>
      <ColorModeProvider value={colorMode}>
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
                <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} thickness={1} />
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
