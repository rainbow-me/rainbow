import React, { memo, useCallback } from 'react';
import { Box, Separator, Text } from '@/design-system';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpsNavbar } from '@/features/perps/components/PerpsNavbar';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { PerpMarketsList } from '@/features/perps/components/PerpMarketsList';
import { navigateToNewPositionScreen } from '@/features/perps/utils';
import { useNavigation } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';
import { PerpMarket } from '@/features/perps/types';

export const PerpsSearchScreen = memo(function PerpsSearchScreen() {
  const navigation = useNavigation();
  const markets = useHyperliquidMarketsStore(state => state.getSearchResults());

  const onPressMarket = useCallback(
    (market: PerpMarket) => {
      navigation.navigate(Routes.PERPS_ACCOUNT_NAVIGATOR, {
        screen: Routes.PERPS_DETAIL_SCREEN,
        params: { market },
      });
    },
    [navigation]
  );

  return (
    <Box background={'surfacePrimary'} style={{ flex: 1 }}>
      <Box justifyContent={'center'} alignItems={'center'}>
        <PerpsNavbar />
        <Text size="11pt" weight="heavy" color="labelQuaternary">
          {`${markets.length} MARKETS`}
        </Text>
      </Box>
      <Box paddingTop={'20px'}>
        <Separator color={'separatorTertiary'} direction="horizontal" />
      </Box>
      <PerpMarketsList onPressMarket={onPressMarket} />
      <SheetHandle />
    </Box>
  );
});

export const PerpsNewPositionSearchScreen = memo(function PerpsNewPositionSearchScreen() {
  const onPressMarket = useCallback((market: PerpMarket) => {
    navigateToNewPositionScreen(market);
  }, []);

  return (
    <Box background={'surfacePrimary'} style={{ flex: 1 }}>
      <Box paddingTop={'20px'}>
        <Separator color={'separatorTertiary'} direction="horizontal" />
      </Box>
      <PerpMarketsList onPressMarket={onPressMarket} />
    </Box>
  );
});
