import React from 'react';
import { View } from 'react-native';

import { Box, Text } from '@/design-system';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { type PerpMarket } from '@/features/perps/types';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import * as i18n from '@/languages';

type PerpMarketDisabledRowProps = {
  market: PerpMarket;
  paddingVertical?: number;
};

export const PerpMarketDisabledRow = function PerpMarketDisabledRow({ market, paddingVertical }: PerpMarketDisabledRowProps) {
  const displayBaseSymbol = extractBaseSymbol(market.baseSymbol);

  return (
    <Box
      width="full"
      flexDirection="row"
      alignItems="center"
      gap={12}
      paddingVertical={paddingVertical ? { custom: paddingVertical } : '10px'}
    >
      <View style={{ opacity: 0.4 }}>
        <HyperliquidTokenIcon symbol={market.symbol} size={40} />
      </View>
      <Box style={{ flex: 1 }} gap={12}>
        <Box flexDirection="row" alignItems="center" gap={6}>
          <Text size="17pt" weight="bold" color="labelQuinary">
            {displayBaseSymbol}
          </Text>
        </Box>
        <Text size="11pt" weight="heavy" color="labelQuinary" uppercase>
          {i18n.t(i18n.l.perps.markets.already_open)}
        </Text>
      </Box>
    </Box>
  );
};
