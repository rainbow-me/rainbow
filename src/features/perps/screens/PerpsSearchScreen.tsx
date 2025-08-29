import React, { memo } from 'react';
import { Box, Separator, Text } from '@/design-system';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpsNavbar } from '@/features/perps/components/PerpsNavbar';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { PerpMarketsList } from '@/features/perps/components/PerpMarketsList';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export const PerpsSearchScreen = memo(function PerpsSearchScreen() {
  const markets = useHyperliquidMarketsStore(state => state.getSearchResults());

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
      <PerpMarketsList />
      <SheetHandle />
    </Box>
  );
});

export const PerpsNewPositionSearchScreen = memo(function PerpsNewPositionSearchScreen() {
  return (
    <Box background={'surfacePrimary'} style={{ flex: 1 }}>
      <Box paddingTop={'20px'}>
        <Separator color={'separatorTertiary'} direction="horizontal" />
      </Box>
      <PerpMarketsList
        onPressMarket={market => {
          // @ts-expect-error TODO (kane): Fix
          Navigation.handleAction(Routes.PERPS_NEW_POSITION_SCREEN, { market });
        }}
      />
    </Box>
  );
});
