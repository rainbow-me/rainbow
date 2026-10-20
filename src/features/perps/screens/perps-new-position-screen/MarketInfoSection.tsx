import React, { memo } from 'react';

import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Box, Text } from '@/design-system';
import { usePriceChangeColors } from '@/features/market/ui/hooks/usePriceChangeColors';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { HYPERLIQUID_TOKEN_ID_SUFFIX } from '@/features/perps/constants';
import { type PerpMarket } from '@/features/perps/types';
import { formatPriceChange } from '@/features/perps/utils';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { select24hChange, selectMidPrice } from '@/state/liveTokens/selectors';

type MarketInfoSectionProps = {
  market: PerpMarket;
};

export const MarketInfoSection = memo(function MarketInfoSection({ market }: MarketInfoSectionProps) {
  const tokenId = `${market.symbol}:${HYPERLIQUID_TOKEN_ID_SUFFIX}`;

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
            tokenId={tokenId}
            fallback={formatPerpAssetPrice(market.midPrice ?? market.price)}
            fallbackUpdatedAt={0}
            selector={selectMidPrice}
            format={formatPerpAssetPrice}
            size="15pt"
            weight="bold"
            color="labelSecondary"
          />
          <LiveTokenText
            selector={select24hChange}
            format={formatPriceChange}
            tokenId={tokenId}
            fallbackUpdatedAt={0}
            fallback={formatPriceChange(market.priceChange['24h'])}
            priceChangeColors={priceChangeColors}
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
