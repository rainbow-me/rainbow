import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Box, Text, TextShadow } from '@/design-system';
import { PerpsPosition } from '@/features/perps/types';
import { PositionSideBadge } from '@/features/perps/components/PositionSideBadge';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { abs } from '@/helpers/utilities';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { navigateToNewPositionScreen } from '@/features/perps/utils';

type PerpsPositionRowProps = {
  position: PerpsPosition;
};

export const PerpsPositionRow = memo(function PerpsPositionRow({ position }: PerpsPositionRowProps) {
  const isPositivePnl = !position.unrealizedPnl.includes('-');
  const pnlColor = isPositivePnl ? 'green' : 'red';
  const formattedValues = useMemo(() => {
    return {
      value: formatAssetPrice({ value: position.value, currency: 'USD' }),
      liquidationPrice: position.liquidationPrice ? formatAssetPrice({ value: position.liquidationPrice, currency: 'USD' }) : 'N/A',
      unrealizedPnl: formatAssetPrice({ value: abs(position.unrealizedPnl), decimalPlaces: 2, currency: 'USD' }),
    };
  }, [position]);
  // TESTING
  const markets = useHyperliquidMarketsStore(state => state.getSortedMarkets());

  return (
    <ButtonPressAnimation
      onPress={() => {
        // TESTING: should actually go to the market details screen
        const market = markets.find(market => market.symbol === position.symbol);
        if (market) {
          navigateToNewPositionScreen(market);
        }
      }}
    >
      <Box paddingHorizontal={'20px'}>
        <Box gap={12}>
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
              {formattedValues.value}
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
              <Box background={pnlColor} style={[StyleSheet.absoluteFillObject, { opacity: 0.04 }]} />
              <Box flexDirection="row" alignItems="center" gap={2}>
                <TextShadow blur={6} shadowOpacity={0.24}>
                  <Text color={pnlColor} size="icon 9px" weight="bold">
                    {isPositivePnl ? UP_ARROW : DOWN_ARROW}
                  </Text>
                </TextShadow>
                <TextShadow blur={6} shadowOpacity={0.24}>
                  <Text color={pnlColor} size="11pt" weight="heavy">
                    {formattedValues.unrealizedPnl}
                  </Text>
                </TextShadow>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
});
