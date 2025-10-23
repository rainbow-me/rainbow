import React, { memo } from 'react';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Bleed, Box, Text, TextIcon, TextShadow, useColorMode } from '@/design-system';
import { PerpMarketRow } from '@/features/perps/components/PerpMarketRow';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { PerpsNavigation } from '@/features/perps/screens/PerpsNavigator';
import { useHyperliquidMarketsStore, useSortedHyperliquidMarkets } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpMarket } from '@/features/perps/types';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import * as i18n from '@/languages';
import { MARKET_SORT_ORDER_LABELS } from '@/features/perps/constants';
import { MarketSortOrderDropdown } from '@/features/perps/components/MarketSortOrderDropdown';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

const MAX_MARKETS_TO_SHOW = 8;

export const MarketsSection = memo(function MarketsSection() {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const markets = useSortedHyperliquidMarkets(state => state.slice(0, MAX_MARKETS_TO_SHOW));
  const selectedSortOrder = useHyperliquidMarketsStore(state => state.sortOrder);

  return (
    <Box gap={14}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <ButtonPressAnimation onPress={() => PerpsNavigation.navigate(Routes.PERPS_SEARCH_SCREEN, { type: 'search' })}>
          <Box flexDirection="row" alignItems="center" gap={8} paddingLeft="4px">
            <Text size="22pt" weight="heavy" color="label">
              {i18n.t(i18n.l.perps.markets.title)}
            </Text>
            <TextIcon size="icon 17px" weight="bold" color="labelQuaternary">
              􀆊
            </TextIcon>
          </Box>
        </ButtonPressAnimation>

        <Box flexDirection="row" alignItems="center" gap={8}>
          <Bleed horizontal="10px" vertical="16px">
            <ButtonPressAnimation onPress={navigateToSearchScreen} style={{ padding: 10 }}>
              <Box
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                height={28}
                width={28}
                borderRadius={14}
                background="fillTertiary"
                borderColor={'separatorSecondary'}
                borderWidth={THICKER_BORDER_WIDTH}
              >
                <TextIcon size="icon 12px" weight="heavy" color="labelTertiary">
                  􀊫
                </TextIcon>
              </Box>
            </ButtonPressAnimation>
          </Bleed>

          <MarketSortOrderDropdown>
            <Box
              backgroundColor={isDarkMode ? undefined : opacityWorklet('#09111F', 0.04)}
              height={28}
              flexDirection="row"
              alignItems="center"
              gap={5}
              paddingRight={{ custom: 9 }}
              paddingLeft={{ custom: 11 }}
              borderColor={'separatorSecondary'}
              borderWidth={THICKER_BORDER_WIDTH}
              borderRadius={22}
            >
              <Text size="15pt" weight="heavy" color="labelTertiary">
                {MARKET_SORT_ORDER_LABELS[selectedSortOrder].label}
              </Text>
              <TextIcon size="icon 12px" weight="bold" color="labelQuaternary">
                {'􀆏'}
              </TextIcon>
            </Box>
          </MarketSortOrderDropdown>
        </Box>
      </Box>

      <Box paddingBottom="20px">
        {markets.map(market => (
          <PerpMarketRow
            key={market.symbol}
            market={market}
            onPress={onPressMarket}
            paddingVertical={10}
            priceChangeColors={accentColors.priceChangeColors}
          />
        ))}
        <ButtonPressAnimation onPress={navigateToSearchScreen}>
          <Box
            backgroundColor={accentColors.opacity3}
            borderRadius={18}
            borderWidth={THICK_BORDER_WIDTH}
            borderColor={{ custom: accentColors.opacity6 }}
            padding="12px"
            alignItems="center"
            marginTop={{ custom: 12 }}
          >
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
                {i18n.t(i18n.l.perps.markets.view_all)}
              </Text>
            </TextShadow>
          </Box>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
});

function onPressMarket(market: PerpMarket): void {
  Navigation.handleAction(Routes.PERPS_DETAIL_SCREEN, {
    market,
  });
}

function navigateToSearchScreen(): void {
  PerpsNavigation.navigate(Routes.PERPS_SEARCH_SCREEN, { type: 'search' });
}
