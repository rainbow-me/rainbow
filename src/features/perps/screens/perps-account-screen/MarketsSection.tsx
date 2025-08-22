import React from 'react';
import { Box, Text } from '@/design-system';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PerpMarketRow } from '@/features/perps/components/PerpMarketRow';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export const MarketsSection = function MarketsSection() {
  const markets = useHyperliquidMarketsStore(state => state.getSortedMarkets());

  return (
    <Box>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box flexDirection="row" alignItems="center" gap={8}>
          <Text size="22pt" weight="heavy" color="label">
            {'Markets'}
          </Text>
          <Text size="17pt" weight="bold" color="labelTertiary">
            {'􀆊'}
          </Text>
        </Box>
        <ButtonPressAnimation
          onPress={() => {
            Navigation.handleAction(Routes.PERPS_SEARCH_SCREEN);
          }}
        >
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            height={28}
            width={28}
            borderRadius={14}
            background="fill"
            borderColor={'fillSecondary'}
            borderWidth={THICK_BORDER_WIDTH}
          >
            <Text size="12pt" weight="bold" color="labelTertiary">
              {'􀊫'}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Box>
      <Box gap={20} paddingTop={'16px'}>
        {markets.slice(0, 10).map(market => (
          <PerpMarketRow key={market.symbol} market={market} />
        ))}
      </Box>
    </Box>
  );
};
