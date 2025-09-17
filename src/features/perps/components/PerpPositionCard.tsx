import React, { memo, useCallback, useMemo } from 'react';
import { Box, Separator, Stack, Text, useColorMode } from '@/design-system';
import { PerpsPosition } from '@/features/perps/types';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { PositionSideBadge } from '@/features/perps/components/PositionSideBadge';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { abs } from '@/helpers/utilities';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { TokenData } from '@/state/liveTokens/liveTokensStore';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
// import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';

type PerpPositionCardProps = {
  position: PerpsPosition;
};

export const PerpPositionCard = memo(function PerpPositionCard({ position }: PerpPositionCardProps) {
  const { isDarkMode } = useColorMode();
  // TODO (kane): does not look good
  // const market = useHyperliquidMarketsStore(state => state.getMarket(position.symbol));
  // const tokenColor = market?.metadata?.colors.color ?? '#677483';
  // const backgroundColor = opacityWorklet(tokenColor, 0.06);
  const backgroundColorDark = opacityWorklet('#677483', 0.08);
  const isNegativePnl = position.unrealizedPnl.includes('-');

  const formattedValues = useMemo(() => {
    return {
      entryPrice: formatPerpAssetPrice(position.entryPrice),
      liquidationPrice: position.liquidationPrice ? formatPerpAssetPrice(position.liquidationPrice) : 'N/A',
      unrealizedPnl: `${position.unrealizedPnl.includes('-') ? '-' : '+'} ${formatCurrency(abs(position.unrealizedPnl))}`,
      positionEquity: formatCurrency(position.equity),
    };
  }, [position]);

  const livePriceSelector = useCallback((state: TokenData) => {
    return formatPerpAssetPrice(state.price);
  }, []);

  const { entryPrice, liquidationPrice, unrealizedPnl, positionEquity } = formattedValues;

  return (
    <Box
      width={'full'}
      backgroundColor={isDarkMode ? backgroundColorDark : 'white'}
      borderRadius={32}
      padding={'16px'}
      borderWidth={isDarkMode ? 2 : 0}
      borderColor={{ custom: backgroundColorDark }}
      // @ts-ignore: TODO
      shadow={isDarkMode ? null : '18px'}
    >
      <Box gap={12}>
        <Box flexDirection="row" alignItems="center" gap={12}>
          <HyperliquidTokenIcon size={40} symbol={position.symbol} />
          <Box gap={8} style={{ flex: 1 }}>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" alignItems="center" gap={4}>
                <Text size="17pt" weight="bold" color="label">
                  {`${position.symbol}`}
                </Text>
                <Text size="13pt" weight="bold" color="labelTertiary">
                  {'􀯻'}
                </Text>
              </Box>
              <Text size="17pt" weight="bold" color="label">
                {positionEquity}
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" alignItems="center" gap={5}>
                <LeverageBadge leverage={position.leverage} />
                <PositionSideBadge side={position.side} />
              </Box>
              <Text size="15pt" weight="bold" color={isNegativePnl ? 'red' : 'green'}>
                {unrealizedPnl}
              </Text>
            </Box>
          </Box>
        </Box>
        <Separator color="separatorTertiary" direction="horizontal" />
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Stack alignHorizontal="left" space={'10px'}>
            <Text size="11pt" weight="bold" color="labelQuaternary">
              {'ENTRY'}
            </Text>
            <Text size="15pt" weight="bold" color="labelSecondary">
              {entryPrice}
            </Text>
          </Stack>
          <Stack alignHorizontal="center" space={'10px'}>
            <Text size="11pt" weight="bold" color="labelQuaternary">
              {'MARK PRICE'}
            </Text>
            <LiveTokenText
              tokenId={getHyperliquidTokenId(position.symbol)}
              selector={livePriceSelector}
              initialValue={'-'}
              size="15pt"
              weight="heavy"
              color="label"
            />
          </Stack>
          <Stack alignHorizontal="right" space={'10px'}>
            <Text size="11pt" weight="bold" color="labelQuaternary">
              {'LIQ. PRICE'}
            </Text>
            <Text size="15pt" weight="bold" color="labelSecondary">
              {liquidationPrice}
            </Text>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
});
