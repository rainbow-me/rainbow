import React from 'react';
import { Box, Stack, Text, TextShadow } from '@/design-system';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { PerpPositionCard } from '@/features/perps/components/PerpPositionCard';
import { abs, greaterThan, isEqual } from '@/helpers/utilities';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { UP_ARROW, DOWN_ARROW } from '@/features/perps/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { navigateToPerpDetailScreen } from '@/features/perps/utils';

function NoPositions() {
  return (
    <Box>
      <Text size="17pt" weight="heavy" color="labelTertiary">
        {'No Open Positions'}
      </Text>
    </Box>
  );
}

export const OpenPositionsSection = function OpenPositionsSection() {
  const positions = useHyperliquidAccountStore(state => state.positions);
  const positionsArray = Object.values(positions);
  const { value, unrealizedPnl, unrealizedPnlPercent } = useHyperliquidAccountStore(state => state.getTotalPositionsInfo());
  const isPositivePnl = greaterThan(unrealizedPnl, 0);
  const isNeutralPnl = isEqual(unrealizedPnl, 0);
  const textColor = isPositivePnl ? 'green' : isNeutralPnl ? 'labelTertiary' : 'red';
  const formattedUnrealizedPnl = formatAssetPrice({
    value: abs(unrealizedPnl),
    currency: 'USD',
  });
  const formattedUnrealizedPnlPercent = `${toFixedWorklet(abs(unrealizedPnlPercent), 2)}%`;
  const formattedValue = formatAssetPrice({
    value,
    currency: 'USD',
  });

  return (
    <Box>
      <Stack space={'20px'}>
        <Box gap={16}>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text size="17pt" weight="heavy" color="labelTertiary">
              {'Open Positions'}
            </Text>
            <Box flexDirection="row" alignItems="center" gap={2}>
              <TextShadow blur={8} shadowOpacity={0.2}>
                <Text size="12pt" weight="heavy" color={textColor}>
                  {isPositivePnl ? UP_ARROW : DOWN_ARROW}
                </Text>
              </TextShadow>
              <TextShadow blur={8} shadowOpacity={0.2}>
                <Text size="17pt" weight="heavy" color={textColor}>
                  {formattedUnrealizedPnlPercent}
                </Text>
              </TextShadow>
            </Box>
          </Box>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text size="30pt" weight="heavy" color="label">
              {formattedValue}
            </Text>
            <Box flexDirection="row" alignItems="center" gap={2}>
              <TextShadow blur={8} shadowOpacity={0.2}>
                <Text size="20pt" weight="heavy" color={textColor}>
                  {isPositivePnl ? '+' : '-'}
                </Text>
              </TextShadow>
              <TextShadow blur={8} shadowOpacity={0.2}>
                <Text size="22pt" weight="heavy" color={textColor}>
                  {formattedUnrealizedPnl}
                </Text>
              </TextShadow>
            </Box>
          </Box>
        </Box>
        <Box gap={20}>
          {positionsArray.length === 0 && <NoPositions />}
          {positionsArray.map(position => (
            <ButtonPressAnimation
              key={position.symbol}
              onPress={() => {
                navigateToPerpDetailScreen(position.symbol);
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
