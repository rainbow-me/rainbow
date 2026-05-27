import React, { memo } from 'react';
import { Keyboard } from 'react-native';

import { DelayedMount } from '@/components/utilities/DelayedMount';
import { Box, Separator, Text, TextIcon, TextShadow, useColorMode } from '@/design-system';
import { MarketSortOrderDropdown } from '@/features/perps/components/MarketSortOrderDropdown';
import { PerpMarketsList } from '@/features/perps/components/PerpMarketsList';
import { FOOTER_HEIGHT, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useMarketSortOrderLabels } from '@/features/perps/hooks/useMarketSortOrderLabels';
import { PerpsNavigation, usePerpsNavigationStore } from '@/features/perps/screens/PerpsNavigator';
import { useFilteredHyperliquidMarkets, useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarket } from '@/features/perps/types';
import { navigateToNewPositionScreen, navigateToPerpDetailScreen } from '@/features/perps/utils';
import { time } from '@/framework/core/utils/time';
import { opacity } from '@/framework/ui/utils/opacity';
import { useOnLeaveRoute } from '@/hooks/useOnLeaveRoute';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { useRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import type { PerpsRoute } from '@/navigation/types';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/styles/constants';

export const PerpsSearchScreen = memo(function PerpsSearchScreen() {
  const { isDarkMode } = useColorMode();
  const { name: route } = useRoute<PerpsRoute>();

  const skipDelayedMount = useStableValue(() => PerpsNavigation.isRouteActive(route));
  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  useOnLeaveRoute(Keyboard.dismiss);

  return (
    <Box backgroundColor={backgroundColor} style={{ flex: 1, top: -4, width: '100%' }}>
      <SearchSubtitle />
      <Box paddingTop="20px" paddingHorizontal="20px">
        <Separator color={'separatorTertiary'} direction="horizontal" thickness={THICK_BORDER_WIDTH} />
      </Box>
      <DelayedMount delay={time.seconds(1)} skipDelayedMount={skipDelayedMount}>
        <PerpMarketsList onPressMarket={onPressMarket} />
        <MarketSortOrderPicker />
      </DelayedMount>
    </Box>
  );
});

const SearchSubtitle = () => {
  const searchType = usePerpsNavigationStore(state => state.getParams(Routes.PERPS_SEARCH_SCREEN)?.type);
  const numberOfMarkets = useFilteredHyperliquidMarkets(state => state.length);
  const marketsLabel = i18n.t(i18n.l.perps.search.markets_count, { count: numberOfMarkets });
  const chooseMarketLabel = i18n.t(i18n.l.perps.search.choose_a_market);
  return (
    <Box alignItems="center" justifyContent="center">
      <Text align="center" color="labelQuaternary" size="11pt" weight="heavy">
        {searchType === 'search' ? marketsLabel : chooseMarketLabel}
      </Text>
    </Box>
  );
};

function onPressMarket(market: PerpMarket): void {
  const searchType = PerpsNavigation.getParams(Routes.PERPS_SEARCH_SCREEN)?.type;
  if (searchType === 'search') navigateToPerpDetailScreen(market.symbol);
  else navigateToNewPositionScreen(market);
}

const MarketSortOrderPicker = () => {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const selectedSortOrder = useHyperliquidMarketsStore(state => state.sortOrder);
  const marketSortOrderLabels = useMarketSortOrderLabels();
  const selectedSortOrderConfig = marketSortOrderLabels[selectedSortOrder];

  return (
    <Box position="absolute" bottom={{ custom: FOOTER_HEIGHT + 24 }} style={{ alignSelf: 'center' }}>
      <MarketSortOrderDropdown>
        <Box
          height={40}
          backgroundColor={isDarkMode ? '#25292E' : '#F0F1F1'}
          flexDirection="row"
          alignItems="center"
          gap={6}
          paddingHorizontal={{ custom: 14 }}
          borderColor={{ custom: isDarkMode ? opacity('#9CA4AD', 0.08) : opacity('#09111F', 0.01) }}
          borderWidth={THICKER_BORDER_WIDTH}
          borderRadius={22}
          shadow={'30px'}
        >
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text size="icon 15px" weight="heavy" color={{ custom: accentColors.opacity100 }}>
              {selectedSortOrderConfig.icon}
            </Text>
          </TextShadow>
          <Text size="17pt" weight="heavy" color="label">
            {selectedSortOrderConfig.label}
          </Text>
          <TextIcon size="icon 13px" weight="heavy" color="labelTertiary">
            {'􀆏'}
          </TextIcon>
        </Box>
      </MarketSortOrderDropdown>
    </Box>
  );
};
