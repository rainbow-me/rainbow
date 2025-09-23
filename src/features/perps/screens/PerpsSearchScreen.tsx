import React, { memo } from 'react';
import { Keyboard } from 'react-native';
import { Box, Separator, Text, useColorMode } from '@/design-system';
import { useFilteredHyperliquidMarkets } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpMarketsList } from '@/features/perps/components/PerpMarketsList';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { navigateToNewPositionScreen, navigateToPerpDetailScreen } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';
import { useOnLeaveRoute } from '@/hooks/useOnLeaveRoute';
import Routes from '@/navigation/routesNames';
import { PerpsNavigation, usePerpsNavigationStore } from '@/features/perps/screens/PerpsNavigator';
import { DelayedMount } from '@/components/utilities/DelayedMount';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { time } from '@/utils/time';

export const PerpsSearchScreen = memo(function PerpsSearchScreen() {
  const { isDarkMode } = useColorMode();
  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  useOnLeaveRoute(Keyboard.dismiss);

  return (
    <Box backgroundColor={backgroundColor} style={{ flex: 1, top: -4, width: '100%' }}>
      <SearchSubtitle />
      <Box paddingTop="20px" paddingHorizontal="20px">
        <Separator color={'separatorTertiary'} direction="horizontal" thickness={THICK_BORDER_WIDTH} />
      </Box>
      <DelayedMount delay={time.seconds(1)}>
        <PerpMarketsList onPressMarket={onPressMarket} />
      </DelayedMount>
    </Box>
  );
});

const SearchSubtitle = () => {
  const searchType = usePerpsNavigationStore(state => state.getParams(Routes.PERPS_SEARCH_SCREEN)?.type);
  const numberOfMarkets = useFilteredHyperliquidMarkets(state => state.length);
  return (
    <Box alignItems="center" justifyContent="center">
      <Text align="center" color="labelQuaternary" size="11pt" weight="heavy">
        {searchType === 'search' ? `${numberOfMarkets} MARKETS` : 'CHOOSE A MARKET'}
      </Text>
    </Box>
  );
};

function onPressMarket(market: PerpMarket): void {
  const searchType = PerpsNavigation.getParams(Routes.PERPS_SEARCH_SCREEN)?.type;
  if (searchType === 'search') navigateToPerpDetailScreen(market.symbol);
  else navigateToNewPositionScreen(market);
}
