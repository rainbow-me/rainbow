import React, { useMemo } from 'react';
import { Box, Stack, Text, TextShadow } from '@/design-system';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { PerpPositionCard } from '@/features/perps/components/PerpPositionCard';
import { abs, greaterThan, isEqual } from '@/helpers/utilities';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { UP_ARROW, DOWN_ARROW } from '@/features/perps/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { navigateToPerpDetailScreen } from '@/features/perps/utils';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { formatCurrency } from '@/helpers/strings';

function NoPositions() {
  return (
    <Box height={100} justifyContent="center" alignItems="center">
      <Text size="17pt" weight="heavy" color="labelTertiary">
        {'No Open Positions'}
      </Text>
    </Box>
  );
}

export const OpenPositionsSection = function OpenPositionsSection() {
  const positions = useHyperliquidAccountStore(state => state.positions);
  const positionsArray = Object.values(positions);
  const hasPositions = positionsArray.length > 0;
  const { equity, unrealizedPnl, unrealizedPnlPercent } = useHyperliquidAccountStore(state => state.getTotalPositionsInfo());
  const isPositivePnl = greaterThan(unrealizedPnl, 0);
  const isNeutralPnl = isEqual(unrealizedPnl, 0);
  const textColor = isPositivePnl ? 'green' : isNeutralPnl ? 'labelTertiary' : 'red';
  const formattedValues = useMemo(() => {
    return {
      equity: formatCurrency(equity, { currency: 'USD' }),
      unrealizedPnl: formatCurrency(abs(unrealizedPnl), { currency: 'USD' }),
      unrealizedPnlPercent: `${toFixedWorklet(abs(unrealizedPnlPercent), 2)}%`,
    };
  }, [equity, unrealizedPnl, unrealizedPnlPercent]);

  return (
    <Box>
      <Stack space={'20px'}>
        <Box gap={16}>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text size="17pt" weight="heavy" color="labelTertiary">
              {'Open Positions'}
            </Text>
            {hasPositions && (
              <Box flexDirection="row" alignItems="center" gap={2}>
                <TextShadow blur={8} shadowOpacity={0.2}>
                  <Text size="12pt" weight="heavy" color={textColor}>
                    {isPositivePnl ? UP_ARROW : DOWN_ARROW}
                  </Text>
                </TextShadow>
                <TextShadow blur={8} shadowOpacity={0.2}>
                  <Text size="17pt" weight="heavy" color={textColor}>
                    {formattedValues.unrealizedPnlPercent}
                  </Text>
                </TextShadow>
              </Box>
            )}
          </Box>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text size="30pt" weight="heavy" color="label">
              {formattedValues.equity}
            </Text>
            {hasPositions && (
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
            )}
          </Box>
        </Box>
        <Box gap={20}>
          {!hasPositions && <NoPositions />}
          {positionsArray.map(position => (
            <ButtonPressAnimation
              key={position.symbol}
              onPress={() => {
                navigateToPerpDetailScreen(position.symbol);
              }}
              onLongPress={() => {
                Navigation.handleAction(Routes.CLOSE_POSITION_BOTTOM_SHEET, {
                  symbol: position.symbol,
                });
              }}
              scaleTo={0.98}
            >
              <PerpPositionCard position={position} />
            </ButtonPressAnimation>
          ))}
        </Box>
      </Stack>
    </Box>
  );
};
