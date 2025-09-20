import { Box, Text } from '@/design-system';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { PerpMarket } from '@/features/perps/types';
import * as i18n from '@/languages';
import React from 'react';

type PerpMarketDisabledRowProps = {
  market: PerpMarket;
};

export const PerpMarketDisabledRow = function PerpMarketDisabledRow({ market }: PerpMarketDisabledRowProps) {
  return (
    <Box width="full" flexDirection="row" alignItems="center" gap={12} style={{ opacity: 0.3 }}>
      <HyperliquidTokenIcon symbol={market.symbol} size={40} />
      <Box style={{ flex: 1 }} gap={8}>
        <Text size="17pt" weight="bold" color="label">
          {market.symbol}
        </Text>
        <Text size="11pt" weight="heavy" color="label" uppercase>
          {i18n.t(i18n.l.perps.markets.already_open)}
        </Text>
      </Box>
    </Box>
  );
};
