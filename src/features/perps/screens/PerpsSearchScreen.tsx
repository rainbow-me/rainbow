import React, { memo, useCallback } from 'react';
import { Box, Separator, Text } from '@/design-system';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpMarketsList } from '@/features/perps/components/PerpMarketsList';
import { navigateToNewPositionScreen, navigateToPerpDetailScreen } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';

export const PerpsSearchScreen = memo(function PerpsSearchScreen() {
  const markets = useHyperliquidMarketsStore(state => state.getSearchResults());

  const onPressMarket = useCallback((market: PerpMarket) => {
    navigateToPerpDetailScreen(market.symbol);
  }, []);

  return (
    <Box background={'surfacePrimary'} style={{ flex: 1 }}>
      <Box justifyContent={'center'} alignItems={'center'}>
        <Text size="11pt" weight="heavy" color="labelQuaternary">
          {`${markets.length} MARKETS`}
        </Text>
      </Box>
      <Box paddingTop={'20px'} paddingHorizontal={'20px'}>
        <Separator color={'separatorTertiary'} direction="horizontal" />
      </Box>
      <PerpMarketsList onPressMarket={onPressMarket} />
    </Box>
  );
});

export const PerpsNewPositionSearchScreen = memo(function PerpsNewPositionSearchScreen() {
  const onPressMarket = useCallback((market: PerpMarket) => {
    navigateToNewPositionScreen(market);
  }, []);

  return (
    <Box background={'surfacePrimary'} style={{ flex: 1 }}>
      <Box justifyContent={'center'} alignItems={'center'}>
        <Text size="11pt" weight="heavy" color="labelQuaternary">
          {'CHOOSE A MARKET'}
        </Text>
      </Box>
      <Box paddingTop={'20px'} paddingHorizontal={'20px'}>
        <Separator color={'separatorTertiary'} direction="horizontal" />
      </Box>
      <PerpMarketsList onPressMarket={onPressMarket} />
    </Box>
  );
});
