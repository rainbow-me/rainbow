import { memo, useMemo } from 'react';
import { Box, Text } from '@/design-system';
import { PerpMarket } from '@/features/perps/types';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { calculateIsolatedLiquidationPriceFromMargin } from '@/features/perps/utils/calculateLiquidationPrice';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';

export const LiquidationInfo = memo(function LiquidationInfo({ market }: { market: PerpMarket }) {
  const leverage = useHlNewPositionStore(state => state.leverage);
  const amount = useHlNewPositionStore(state => state.amount);
  const side = useHlNewPositionStore(state => state.positionSide);
  const midPrice = useLiveTokenValue({
    tokenId: getHyperliquidTokenId(market.symbol),
    initialValue: market.price,
    selector: state => state.midPrice ?? state.price,
  });

  const estimatedLiquidationPrice = useMemo(() => {
    if (!leverage || !amount) return null;

    return calculateIsolatedLiquidationPriceFromMargin({
      entryPrice: midPrice,
      marginAmount: amount,
      positionSide: side,
      leverage,
      market,
    });
  }, [leverage, amount, market, midPrice, side]);

  const liquidationDistanceFromCurrentPrice = useMemo(() => {
    if (!estimatedLiquidationPrice || !midPrice) return '-';
    return ((Number(midPrice) - Number(estimatedLiquidationPrice)) / Number(midPrice)) * 100;
  }, [estimatedLiquidationPrice, midPrice]);

  const liquidationDistanceFromCurrentPriceDisplay = useMemo(() => {
    if (liquidationDistanceFromCurrentPrice === '-') return '-';
    return `${liquidationDistanceFromCurrentPrice > 0 ? '-' : '+'}${Math.abs(liquidationDistanceFromCurrentPrice).toFixed(2)}%`;
  }, [liquidationDistanceFromCurrentPrice]);

  const liquidationDistanceFromCurrentPriceColor = useMemo(() => {
    if (liquidationDistanceFromCurrentPrice === '-') return 'labelQuaternary';
    return liquidationDistanceFromCurrentPrice > 0 ? 'red' : 'green';
  }, [liquidationDistanceFromCurrentPrice]);

  return (
    <Box gap={12}>
      <Box flexDirection="row" alignItems="center" gap={6}>
        <HyperliquidTokenIcon symbol={market.symbol} size={16} />
        <Box flexDirection="row" alignItems="center" gap={4}>
          <Text size="15pt" weight="bold" color={'labelQuaternary'}>
            {'Liquidated at'}
          </Text>
          <Text size="15pt" weight="heavy" color={'labelSecondary'}>
            {estimatedLiquidationPrice ? formatPerpAssetPrice(estimatedLiquidationPrice.toString()) : '-'}
          </Text>
        </Box>
      </Box>
      <Box flexDirection="row" alignItems="center" gap={4}>
        <Text size="15pt" weight="bold" color={liquidationDistanceFromCurrentPriceColor}>
          {liquidationDistanceFromCurrentPriceDisplay}
        </Text>
        <Text size="15pt" weight="bold" color={'labelSecondary'}>
          {'from current price'}
        </Text>
      </Box>
    </Box>
  );
});
