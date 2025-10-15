import { memo, useMemo, Fragment } from 'react';
import { PerpMarket, PerpsPosition } from '@/features/perps/types';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { Box, Text, TextShadow, Separator, useColorMode } from '@/design-system';
import { abs, greaterThan, isEqual, isPositive, multiply } from '@/helpers/utilities';
import { toFixedWorklet, getPercentageDifferenceWorklet } from '@/safe-math/SafeMath';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

export const PositionValueCard = memo(function PositionValueCard({ position }: { position: PerpsPosition }) {
  const { isDarkMode } = useColorMode();
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
      backgroundColor={isDarkMode ? accentColors.surfacePrimary : accentColors.opacity8}
      borderRadius={28}
      borderWidth={isDarkMode ? 2 : THICK_BORDER_WIDTH}
      borderColor={{ custom: accentColors.opacity5 }}
      padding="20px"
      gap={14}
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text size="17pt" weight="bold" color={isDarkMode ? 'labelSecondary' : 'labelTertiary'}>
          {i18n.perps.positions.position_value()}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={3}>
          <TextShadow blur={8} shadowOpacity={0.2}>
            <Text align="center" size="icon 12px" weight="heavy" color={textColor}>
              {isPositivePnl ? UP_ARROW : DOWN_ARROW}
            </Text>
          </TextShadow>
          <TextShadow blur={8} shadowOpacity={0.2}>
            <Text align="right" size="17pt" weight="heavy" color={textColor}>
              {formattedValues.returnOnEquity}
            </Text>
          </TextShadow>
        </Box>
      </Box>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text size="22pt" weight="heavy" color={isDarkMode ? 'label' : { custom: accentColors.opacity100 }}>
          {formattedValues.equity}
        </Text>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flexDirection="row" alignItems="center" gap={2}>
            <TextShadow blur={8} shadowOpacity={0.2}>
              <Text align="center" size="20pt" weight="heavy" color={textColor}>
                {isPositivePnl ? '+' : '-'}
              </Text>
            </TextShadow>
            <TextShadow blur={8} shadowOpacity={0.2}>
              <Text align="right" size="22pt" weight="heavy" color={textColor}>
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
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();

  const liquidationPrice = position.liquidationPrice ? formatPerpAssetPrice(position.liquidationPrice) : i18n.perps.common.not_available();
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
      title: i18n.perps.positions.mark_price_full(),
      value: formatPerpAssetPrice(liveMarkPrice),
    },
    {
      title: i18n.perps.positions.entry_price(),
      value: formatPerpAssetPrice(position.entryPrice),
    },
    {
      title: i18n.perps.positions.funding(),
      value: `${isPositive(position.funding) ? '-' : ''}${formatCurrency(position.funding)}`,
    },
  ];

  const lightModeFill = opacityWorklet('#09111F', 0.02);

  return (
    <Box
      backgroundColor={isDarkMode ? accentColors.surfacePrimary : lightModeFill}
      borderRadius={28}
      borderWidth={isDarkMode ? 2 : THICK_BORDER_WIDTH}
      borderColor={{ custom: isDarkMode ? accentColors.opacity6 : lightModeFill }}
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
              {i18n.perps.positions.liquidation_price()}
            </Text>
          </Box>
          {targetPriceDifferential && (
            <Box flexDirection="row" alignItems="center" gap={5} marginTop={{ custom: 12 }}>
              <Text color={liquidationPriceIsClose ? 'red' : 'labelSecondary'} size="13pt" weight="heavy">
                {`${toFixedWorklet(targetPriceDifferential, 2)}%`}
              </Text>
              <Text color="labelTertiary" size="13pt" weight="bold">
                {i18n.perps.new_position.from_current_price()}
              </Text>
            </Box>
          )}
        </Box>
        <Text align="right" color={isDarkMode ? 'white' : 'label'} size="17pt" weight="bold">
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
            <Text align="right" color="label" size="17pt" weight="bold">
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
