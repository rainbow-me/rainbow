import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, Separator, Text, TextShadow, useForegroundColor } from '@/design-system';
import { PerpsPosition } from '@/features/perps/types';
import { PositionSideBadge } from '@/features/perps/components/PositionSideBadge';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { abs } from '@/helpers/utilities';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { navigateToPerpDetailScreen } from '@/features/perps/utils';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';

type PerpsPositionRowProps = {
  position: PerpsPosition;
};

export const PerpsPositionRow = memo(function PerpsPositionRow({ position }: PerpsPositionRowProps) {
  const isPositivePnl = !position.unrealizedPnl.includes('-');
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const pnlColor = isPositivePnl ? green : red;
  // TODO POSSIBLE (kane): technically we only need this if the user clicks the row, so would be ideal to offload the fetching to the PerpDetailScreen, but would then result in a brief loading state for the whole screen.
  const market = useHyperliquidMarketsStore(state => state.getMarket(position.symbol));

  const formattedValues = useMemo(() => {
    return {
      equity: formatCurrency(position.equity),
      liquidationPrice: position.liquidationPrice ? formatAssetPrice({ value: position.liquidationPrice, currency: 'USD' }) : 'N/A',
      unrealizedPnl: formatCurrency(abs(position.unrealizedPnl)),
    };
  }, [position]);

  const navigateToPerpDetail = useCallback(() => {
    if (!market) return;
    navigateToPerpDetailScreen(market.symbol);
  }, [market]);

  return (
    <Box paddingHorizontal={'20px'}>
      <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
      <ButtonPressAnimation onPress={navigateToPerpDetail} scaleTo={0.96}>
        <Box height="full" justifyContent="center">
          <Box gap={10}>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" alignItems="center" gap={8}>
                <HyperliquidTokenIcon symbol={position.symbol} style={{ width: 20, height: 20, borderRadius: 10 }} />
                <Text color="label" size="17pt" weight="semibold">
                  {position.symbol}
                </Text>
                <Box flexDirection="row" alignItems="center" gap={5}>
                  <LeverageBadge leverage={position.leverage} />
                  <PositionSideBadge side={position.side} />
                </Box>
              </Box>
              <Text color="label" size="17pt" weight="semibold">
                {formattedValues.equity}
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" alignItems="center" gap={4}>
                <Text color="labelQuaternary" size="11pt" weight="bold">
                  {'LIQ'}
                </Text>
                <Text color="labelTertiary" size="11pt" weight="heavy">
                  {formattedValues.liquidationPrice}
                </Text>
              </Box>
              <Box
                height={18}
                paddingHorizontal={'4px'}
                borderRadius={7.5}
                justifyContent={'center'}
                alignItems={'center'}
                borderWidth={THICK_BORDER_WIDTH}
                borderColor={{ custom: opacityWorklet(pnlColor, 0.16) }}
              >
                <Box backgroundColor={pnlColor} style={[StyleSheet.absoluteFillObject, { opacity: 0.04 }]} />
                <Box flexDirection="row" alignItems="center" gap={2}>
                  <TextShadow blur={6} shadowOpacity={0.24}>
                    <Text color={{ custom: pnlColor }} size="icon 9px" weight="bold">
                      {isPositivePnl ? UP_ARROW : DOWN_ARROW}
                    </Text>
                  </TextShadow>
                  <TextShadow blur={6} shadowOpacity={0.24}>
                    <Text color={{ custom: pnlColor }} size="11pt" weight="heavy">
                      {formattedValues.unrealizedPnl}
                    </Text>
                  </TextShadow>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
});
