import React, { useMemo } from 'react';
import { AnimatedText, Box, Text, useForegroundColor } from '@/design-system';
import { PerpMarket } from '@/features/perps/types';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { abbreviateNumberWorklet } from '@/helpers/utilities';
import { LiveTokenText, useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { formatPriceChange, getHyperliquidTokenId } from '@/features/perps/utils';

type PerpMarketRowProps = {
  market: PerpMarket;
};

export const PerpMarketRow = function PerpMarketRow({ market }: PerpMarketRowProps) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelTertiary = useForegroundColor('labelTertiary');

  // TODO (kane): does this need to be live?
  const volume = useMemo(() => {
    return abbreviateNumberWorklet(parseFloat(market.volume['24h']), 1);
  }, [market.volume]);

  const livePrice = useLiveTokenSharedValue({
    tokenId: getHyperliquidTokenId(market.symbol),
    initialValue: formatAssetPrice({ value: market.price, currency: 'USD' }),
    selector: state => {
      return formatAssetPrice({ value: state.price, currency: 'USD' });
    },
  });

  return (
    <Box width="full" flexDirection="row" alignItems="center" gap={12}>
      <HyperliquidTokenIcon symbol={market.symbol} style={{ width: 40, height: 40 }} />
      <Box style={{ flex: 1 }} gap={8}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text size="17pt" weight="bold" color="label">
            {market.symbol}
          </Text>
          <AnimatedText size="17pt" weight="bold" color="label">
            {livePrice}
          </AnimatedText>
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flexDirection="row" alignItems="center" gap={4}>
            <Box flexDirection="row" alignItems="center" gap={4}>
              <Text size="11pt" weight="bold" color="labelQuaternary">
                {'UP TO'}
              </Text>
              <LeverageBadge leverage={market.maxLeverage} />
            </Box>
            <Box width={1} height={10} background="fillQuaternary" borderRadius={1} />
            <Box flexDirection="row" alignItems="center" gap={4}>
              <Text size="11pt" weight="bold" color="labelQuaternary">
                {'VOL'}
              </Text>
              <Text size="11pt" weight="heavy" color="labelTertiary">
                {volume}
              </Text>
            </Box>
          </Box>
          <LiveTokenText
            selector={state => {
              return formatPriceChange(state.change.change24hPct);
            }}
            tokenId={getHyperliquidTokenId(market.symbol)}
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
            size="11pt"
            weight="heavy"
            align="right"
          />
        </Box>
      </Box>
    </Box>
  );
};
