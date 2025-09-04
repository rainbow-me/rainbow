import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Box, Text, TextShadow, useForegroundColor } from '@/design-system';
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
import { useNavigation } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';

type PerpsPositionRowProps = {
  position: PerpsPosition;
};

export const PerpsPositionRow = memo(function PerpsPositionRow({ position }: PerpsPositionRowProps) {
  const navigation = useNavigation();
  const isPositivePnl = !position.unrealizedPnl.includes('-');
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const pnlColor = isPositivePnl ? green : red;
  // TODO POSSIBLE (kane): technically we only need this if the user clicks the row, so would be ideal to offload the fetching to the PerpDetailScreen, but would then result in a brief loading state for the whole screen.
  const market = useHyperliquidMarketsStore(state => state.getMarket(position.symbol));

  const formattedValues = useMemo(() => {
    return {
      value: formatAssetPrice({ value: position.value, currency: 'USD' }),
      liquidationPrice: position.liquidationPrice ? formatAssetPrice({ value: position.liquidationPrice, currency: 'USD' }) : 'N/A',
      unrealizedPnl: formatAssetPrice({ value: abs(position.unrealizedPnl), decimalPlaces: 2, currency: 'USD' }),
    };
  }, [position]);

  const navigateToPerpDetail = useCallback(() => {
    if (market) {
      // We use the hook navigator here because Navigation.handleAction is not properly typed for nested stack params
      navigation.navigate(Routes.PERPS_ACCOUNT_NAVIGATOR, {
        screen: Routes.PERPS_DETAIL_SCREEN,
        params: { market },
      });
    }
  }, [navigation, market]);

  return (
    <ButtonPressAnimation onPress={navigateToPerpDetail}>
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
  );
});
