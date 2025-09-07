import React, { memo } from 'react';
import { Box, Text, useForegroundColor } from '@/design-system';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatPriceChange } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';

type MarketInfoSectionProps = {
  market: PerpMarket;
};

export const MarketInfoSection = memo(function MarketInfoSection({ market }: MarketInfoSectionProps) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelTertiary = useForegroundColor('labelTertiary');

  return (
    <Box flexDirection="row" alignItems="center" gap={12}>
      <HyperliquidTokenIcon symbol={market.symbol} style={{ width: 40, height: 40 }} />
      <Box gap={12}>
        <Text size="17pt" weight="bold" color="label">
          {market.symbol}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={8}>
          <LiveTokenText
            tokenId={`${market.symbol}:hl`}
            initialValue={formatAssetPrice({ value: market.midPrice ?? market.price, currency: 'USD' })}
            initialValueLastUpdated={0}
            selector={token => {
              return formatAssetPrice({ value: token.midPrice ?? token.price, currency: 'USD' });
            }}
            size="15pt"
            weight="bold"
            color="labelSecondary"
          />
          <LiveTokenText
            selector={state => {
              return formatPriceChange(state.change.change24hPct);
            }}
            tokenId={`${market.symbol}:hl`}
            initialValueLastUpdated={0}
            initialValue={formatPriceChange(market.priceChange['24h'])}
            autoSubscriptionEnabled={false}
            usePriceChangeColor
            priceChangeChangeColors={{
              positive: green,
              negative: red,
              neutral: labelTertiary,
            }}
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
