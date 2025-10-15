import React, { memo, useCallback, useMemo } from 'react';
import { Bleed, Box, Separator, Text, TextShadow, useForegroundColor } from '@/design-system';
import { PerpsPosition } from '@/features/perps/types';
import { PositionSideBadge } from '@/features/perps/components/PositionSideBadge';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { abs } from '@/helpers/utilities';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { navigateToPerpDetailScreen } from '@/features/perps/utils';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import i18n from '@/languages';

type PerpsPositionRowProps = {
  position: PerpsPosition;
};

export const PerpsPositionRow = memo(function PerpsPositionRow({ position }: PerpsPositionRowProps) {
  const isPositivePnl = !position.unrealizedPnl.includes('-');
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const pnlColor = isPositivePnl ? green : red;
  const market = useHyperliquidMarketsStore(state => state.getMarket(position.symbol));

  const formattedValues = useMemo(() => {
    return {
      equity: formatCurrency(position.equity),
      liquidationPrice: position.liquidationPrice ? formatPerpAssetPrice(position.liquidationPrice) : i18n.perps.common.not_available(),
      unrealizedPnl: formatCurrency(abs(position.unrealizedPnl)),
    };
  }, [position]);

  const navigateToPerpDetail = useCallback(() => {
    if (!market) return;
    navigateToPerpDetailScreen(market.symbol);
  }, [market]);

  return (
    <Box paddingHorizontal="20px">
      <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
      <ButtonPressAnimation
        onPress={navigateToPerpDetail}
        onLongPress={() => {
          if (!market) return;
          Navigation.handleAction(Routes.CLOSE_POSITION_BOTTOM_SHEET, {
            symbol: market.symbol,
          });
        }}
        scaleTo={0.96}
      >
        <Box height="full" justifyContent="center">
          <Box gap={16}>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" alignItems="center" gap={8}>
                <Bleed vertical="8px">
                  <HyperliquidTokenIcon symbol={position.symbol} size={20} />
                </Bleed>
                <Text color="label" size="17pt" weight="semibold">
                  {position.symbol}
                </Text>
                <Box flexDirection="row" alignItems="center" gap={5}>
                  <LeverageBadge leverage={position.leverage} />
                  <PositionSideBadge side={position.side} />
                </Box>
              </Box>
              <Text align="right" color="label" size="17pt" weight="semibold">
                {formattedValues.equity}
              </Text>
            </Box>

            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" alignItems="center" gap={4}>
                <Text color="labelQuaternary" size="11pt" weight="bold">
                  {i18n.perps.common.liq().toUpperCase()}
                </Text>
                <Text color="labelTertiary" size="11pt" weight="heavy">
                  {formattedValues.liquidationPrice}
                </Text>
              </Box>
              <Bleed right="4px" vertical="8px">
                <Box
                  height={18}
                  paddingRight="6px"
                  paddingLeft={{ custom: 5.5 }}
                  flexDirection="row"
                  alignItems="center"
                  gap={2}
                  borderRadius={16}
                  borderWidth={THICK_BORDER_WIDTH}
                  borderColor={{ custom: opacityWorklet(pnlColor, 0.12) }}
                  backgroundColor={opacityWorklet(pnlColor, 0.04)}
                >
                  <TextShadow blur={6} shadowOpacity={0.24}>
                    <Text align="center" color={{ custom: pnlColor }} size="icon 8px" weight="black" style={{ top: 0.5 }}>
                      {isPositivePnl ? UP_ARROW : DOWN_ARROW}
                    </Text>
                  </TextShadow>
                  <TextShadow blur={6} shadowOpacity={0.24}>
                    <Text align="center" color={{ custom: pnlColor }} size="11pt" weight="heavy">
                      {formattedValues.unrealizedPnl}
                    </Text>
                  </TextShadow>
                </Box>
              </Bleed>
            </Box>
          </Box>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
});
