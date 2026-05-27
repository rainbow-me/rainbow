import React, { memo } from 'react';

import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Box, Text } from '@/design-system';
import { usePriceChangeColors } from '@/design-system/color/usePriceChangeColors';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { HYPERLIQUID_TOKEN_ID_SUFFIX } from '@/features/perps/constants';
import { type PerpMarket } from '@/features/perps/types';
import { formatPriceChange } from '@/features/perps/utils';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';

type MarketInfoSectionProps = {
  market: PerpMarket;
};

export const MarketInfoSection = memo(function MarketInfoSection({ market }: MarketInfoSectionProps) {
  const priceChangeColors = usePriceChangeColors();

  return (
    <Box flexDirection="row" alignItems="center" gap={12}>
      <HyperliquidTokenIcon size={40} symbol={market.symbol} />
      <Box gap={12}>
        <Box flexDirection="row" alignItems="center" gap={6}>
          <Text size="17pt" weight="bold" color="label">
            {market.baseSymbol}
          </Text>
        </Box>
        <Box flexDirection="row" alignItems="center" gap={8}>
          <LiveTokenText
            tokenId={`${market.symbol}:${HYPERLIQUID_TOKEN_ID_SUFFIX}`}
            initialValue={formatPerpAssetPrice(market.midPrice ?? market.price)}
            initialValueLastUpdated={0}
            selector={token => {
              return formatPerpAssetPrice(token.midPrice ?? token.price);
            }}
            size="15pt"
            weight="bold"
            color="labelSecondary"
          />
          <LiveTokenText
            selector={state => {
              return formatPriceChange(state.change.change24hPct);
            }}
            tokenId={`${market.symbol}:${HYPERLIQUID_TOKEN_ID_SUFFIX}`}
            initialValueLastUpdated={0}
            initialValue={formatPriceChange(market.priceChange['24h'])}
            autoSubscriptionEnabled={false}
            isPriceChangeColorEnabled={true}
            priceChangeChangeColors={priceChangeColors}
            color={'label'}
            size="15pt"
            weight="bold"
            align="right"
          />
        </Box>
      </Box>
    </Box>
  );
});
