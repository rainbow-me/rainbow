import React, { useMemo } from 'react';
import i18n from '@/languages';
import { Box, Text } from '@/design-system';
import { PerpMarket } from '@/features/perps/types';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatNumber } from '@/helpers/strings';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { formatPriceChange, getHyperliquidTokenId } from '@/features/perps/utils';
import { ButtonPressAnimation } from '@/components/animations';
import { TokenData } from '@/state/liveTokens/liveTokensStore';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';

type PerpMarketRowProps = {
  market: PerpMarket;
  onPress?: (market: PerpMarket) => void;
  paddingVertical?: number;
  priceChangeColors: {
    positive: string;
    negative: string;
    neutral: string;
  };
};

export const PerpMarketRow = function PerpMarketRow({ market, onPress, paddingVertical, priceChangeColors }: PerpMarketRowProps) {
  const tokenId = getHyperliquidTokenId(market.symbol);
  const volume = useMemo(() => {
    return formatNumber(market.volume['24h'], { useOrderSuffix: true, decimals: 1, style: '$' });
  }, [market.volume]);

  return (
    <ButtonPressAnimation
      onPress={() => onPress?.(market)}
      disabled={!onPress}
      scaleTo={0.975}
      style={{ paddingVertical: paddingVertical ?? 10 }}
    >
      <Box width="full" flexDirection="row" alignItems="center" gap={12}>
        <HyperliquidTokenIcon symbol={market.symbol} size={40} />
        <Box style={{ flex: 1 }} gap={12}>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text size="17pt" weight="bold" color="label">
              {market.symbol}
            </Text>
            <LiveTokenText
              align="right"
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
            <Box flexDirection="row" alignItems="center" gap={7}>
              <Box flexDirection="row" alignItems="center" gap={5}>
                <Text size="11pt" weight="bold" color="labelQuaternary">
                  {i18n.perps.up_to().toUpperCase()}
                </Text>
                <LeverageBadge leverage={market.maxLeverage} />
              </Box>
              <Box width={1} height={10} background="fillQuaternary" borderRadius={1} />
              <Box flexDirection="row" alignItems="center" gap={4}>
                <Text size="11pt" weight="bold" color="labelQuaternary">
                  {i18n.market_data.vol()}
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
              isPriceChangeColorEnabled={true}
              priceChangeChangeColors={priceChangeColors}
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

function livePriceChangeSelector(state: TokenData): string {
  return formatPriceChange(state.change.change24hPct);
}

function livePriceSelector(state: TokenData): string {
  return formatPerpAssetPrice(state.midPrice ?? state.price);
}
