import React, { useCallback, useMemo } from 'react';
import { Box, Text, useForegroundColor } from '@/design-system';
import { PerpMarket } from '@/features/perps/types';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { abbreviateNumberWorklet } from '@/helpers/utilities';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { formatPriceChange, getHyperliquidTokenId } from '@/features/perps/utils';
import { ButtonPressAnimation } from '@/components/animations';
import { TokenData } from '@/state/liveTokens/liveTokensStore';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';

type PerpMarketRowProps = {
  market: PerpMarket;
  onPress?: (market: PerpMarket) => void;
};

export const PerpMarketRow = function PerpMarketRow({ market, onPress }: PerpMarketRowProps) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelTertiary = useForegroundColor('labelTertiary');
  const tokenId = getHyperliquidTokenId(market.symbol);

  const volume = useMemo(() => {
    return abbreviateNumberWorklet(Number(market.volume['24h']), 1);
  }, [market.volume]);

  const livePriceSelector = useCallback((state: TokenData) => {
    return formatPerpAssetPrice(state.midPrice ?? state.price);
  }, []);

  const livePriceChangeSelector = useCallback((state: TokenData) => {
    return formatPriceChange(state.change.change24hPct);
  }, []);

  return (
    <ButtonPressAnimation onPress={() => onPress?.(market)} disabled={!onPress} scaleTo={0.98}>
      <Box width="full" flexDirection="row" alignItems="center" gap={12}>
        <HyperliquidTokenIcon symbol={market.symbol} size={40} />
        <Box style={{ flex: 1 }} gap={8}>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text size="17pt" weight="bold" color="label">
              {market.symbol}
            </Text>
            <LiveTokenText
              selector={livePriceSelector}
              tokenId={tokenId}
              initialValueLastUpdated={0}
              initialValue={formatPerpAssetPrice(market.midPrice ?? market.price)}
              autoSubscriptionEnabled={true}
              color={'label'}
              size="17pt"
              weight="bold"
            />
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
              selector={livePriceChangeSelector}
              tokenId={tokenId}
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
    </ButtonPressAnimation>
  );
};
