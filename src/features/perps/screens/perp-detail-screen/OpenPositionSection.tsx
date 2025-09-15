import { memo, useMemo, Fragment } from 'react';
import { PerpMarket, PerpsPosition } from '@/features/perps/types';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { Box, Text, TextShadow, AnimatedText, Separator } from '@/design-system';
import { abs, greaterThan, isEqual, isPositive, multiply } from '@/helpers/utilities';
import { toFixedWorklet, getPercentageDifferenceWorklet } from '@/safe-math/SafeMath';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getHyperliquidTokenId } from '@/features/perps/utils';

export const PositionValueCard = memo(function PositionValueCard({ position }: { position: PerpsPosition }) {
  const { accentColors } = usePerpsAccentColorContext();

  const { unrealizedPnl, equity, returnOnEquity } = position;
  const isPositivePnl = greaterThan(unrealizedPnl, 0);
  const isNeutralPnl = isEqual(unrealizedPnl, 0);
  const textColor = isPositivePnl ? 'green' : isNeutralPnl ? 'labelTertiary' : 'red';

  const formattedValues = useMemo(() => {
    return {
      unrealizedPnl: formatCurrency(abs(unrealizedPnl)),
      returnOnEquity: `${toFixedWorklet(multiply(abs(returnOnEquity), 100), 2)}%`,
      equity: formatCurrency(equity),
    };
  }, [unrealizedPnl, equity, returnOnEquity]);

  return (
    <Box
      backgroundColor={accentColors.surfacePrimary}
      borderRadius={28}
      borderWidth={2}
      borderColor={{ custom: accentColors.opacity6 }}
      padding="20px"
      gap={14}
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text size="17pt" weight="bold" color="labelSecondary">
          {'Position Value'}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={2}>
          <TextShadow blur={8} shadowOpacity={0.2}>
            <Text size="12pt" weight="heavy" color={textColor}>
              {isPositivePnl ? UP_ARROW : DOWN_ARROW}
            </Text>
          </TextShadow>
          <TextShadow blur={8} shadowOpacity={0.2}>
            <Text size="17pt" weight="heavy" color={textColor}>
              {formattedValues.returnOnEquity}
            </Text>
          </TextShadow>
        </Box>
      </Box>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <AnimatedText size="22pt" weight="heavy" color="label">
          {formattedValues.equity}
        </AnimatedText>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flexDirection="row" alignItems="center" gap={2}>
            <TextShadow blur={8} shadowOpacity={0.2}>
              <Text size="20pt" weight="heavy" color={textColor}>
                {isPositivePnl ? '+' : '-'}
              </Text>
            </TextShadow>
            <TextShadow blur={8} shadowOpacity={0.2}>
              <Text size="22pt" weight="heavy" color={textColor}>
                {formattedValues.unrealizedPnl}
              </Text>
            </TextShadow>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

const PositionDetailsCard = memo(function PositionDetailsCard({ market, position }: { market: PerpMarket; position: PerpsPosition }) {
  const { accentColors } = usePerpsAccentColorContext();

  const liquidationPrice = position.liquidationPrice ? formatPerpAssetPrice(position.liquidationPrice) : 'N/A';
  const liveMarkPrice = useLiveTokenValue({
    tokenId: getHyperliquidTokenId(market.symbol),
    initialValue: market.price,
    selector: state => state.price,
  });
  const targetPriceDifferential = useMemo(() => {
    if (!position.liquidationPrice) return null;
    return getPercentageDifferenceWorklet(liveMarkPrice, position.liquidationPrice);
  }, [position.liquidationPrice, liveMarkPrice]);
  const liquidationPriceIsClose = targetPriceDifferential && Math.abs(Number(targetPriceDifferential)) < 2;

  const items = [
    {
      title: 'Mark Price',
      value: formatPerpAssetPrice(liveMarkPrice),
    },
    {
      title: 'Entry Price',
      value: formatPerpAssetPrice(position.entryPrice),
    },
    {
      title: 'Funding',
      value: isPositive(position.funding) ? `-${formatCurrency(position.funding)}` : `+${formatCurrency(position.funding)}`,
    },
  ];

  return (
    <Box
      backgroundColor={accentColors.surfacePrimary}
      borderRadius={28}
      borderWidth={2}
      borderColor={{ custom: accentColors.opacity6 }}
      padding="20px"
      gap={16}
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={8}>
        <Box>
          <Box flexDirection="row" alignItems="center" gap={6}>
            {liquidationPriceIsClose && (
              <Text size="13pt" weight="semibold" color="red">
                􀇿
              </Text>
            )}
            <Text size="17pt" weight="semibold" color="labelSecondary">
              {'Liquidation Price'}
            </Text>
          </Box>
          {targetPriceDifferential && (
            <Box flexDirection="row" alignItems="center" gap={5} marginTop={{ custom: 12 }}>
              <Text color={liquidationPriceIsClose ? 'red' : 'green'} size="13pt" weight="heavy">
                {`${toFixedWorklet(targetPriceDifferential, 2)}%`}
              </Text>
              <Text color="labelTertiary" size="13pt" weight="heavy">
                from current price
              </Text>
            </Box>
          )}
        </Box>
        <Text color="white" size="17pt" weight="bold">
          {liquidationPrice}
        </Text>
      </Box>
      <Separator color="separatorTertiary" thickness={1} direction="horizontal" />
      {items.map((item, index) => (
        <Fragment key={item.title}>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text size="17pt" weight="semibold" color="labelSecondary">
              {item.title}
            </Text>
            <Text color="label" size="17pt" weight="bold">
              {item.value}
            </Text>
          </Box>
          {index !== items.length - 1 && <Separator color="separatorTertiary" thickness={1} direction="horizontal" />}
        </Fragment>
      ))}
    </Box>
  );
});

export const OpenPositionSection = memo(function OpenPositionSection({ market }: { market: PerpMarket }) {
  const position = useHyperliquidAccountStore(state => state.getPosition(market.symbol));

  if (!position) return null;

  return (
    <Box gap={16}>
      <PositionValueCard position={position} />
      <PositionDetailsCard market={market} position={position} />
    </Box>
  );
});
