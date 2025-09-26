import React, { memo, useMemo } from 'react';
import { Bleed, Box, BoxProps, globalColors, Separator, Stack, Text, useColorMode } from '@/design-system';
import { PerpsPosition } from '@/features/perps/types';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { PositionSideBadge } from '@/features/perps/components/PositionSideBadge';
import { getColorValueForThemeWorklet, getHighContrastColor, opacityWorklet } from '@/__swaps__/utils/swaps';
import { abs } from '@/helpers/utilities';
import { useStableValue } from '@/hooks/useStableValue';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { TokenData } from '@/state/liveTokens/liveTokensStore';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { ETH_COLOR_DARK, THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import * as i18n from '@/languages';

type PerpPositionCardProps = {
  position: PerpsPosition;
};

export const PerpPositionCard = memo(function PerpPositionCard({ position }: PerpPositionCardProps) {
  const { isDarkMode } = useColorMode();
  const isNegativePnl = position.unrealizedPnl.includes('-');

  const backgroundColor = useMemo(
    () =>
      isDarkMode
        ? opacityWorklet(getColorValueForThemeWorklet(getHighContrastColor(ETH_COLOR_DARK), isDarkMode), 0.08)
        : opacityWorklet(globalColors.white100, 0.8),
    [isDarkMode]
  );

  const formattedValues = useMemo(() => {
    return {
      entryPrice: formatPerpAssetPrice(position.entryPrice),
      liquidationPrice: position.liquidationPrice
        ? formatPerpAssetPrice(position.liquidationPrice)
        : i18n.t(i18n.l.perps.common.not_available),
      unrealizedPnl: `${position.unrealizedPnl.includes('-') ? '-' : '+'} ${formatCurrency(abs(position.unrealizedPnl))}`,
      positionEquity: formatCurrency(position.equity),
    };
  }, [position]);

  const { entryPrice, liquidationPrice, unrealizedPnl, positionEquity } = formattedValues;

  const ShadowWrapper = useMemo(
    () =>
      function ShadowWrapper({ children }: { children: React.ReactNode }) {
        const shadowProps: BoxProps = isDarkMode ? { backgroundColor } : { backgroundColor, shadow: '18px' };
        return (
          <Box
            borderColor={{ custom: backgroundColor }}
            borderRadius={32}
            borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : 0}
            padding={{ custom: 18 }}
            paddingTop="16px"
            width="full"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...shadowProps}
          >
            {children}
          </Box>
        );
      },
    [backgroundColor, isDarkMode]
  );

  return (
    <ShadowWrapper>
      <Box gap={12}>
        <Box flexDirection="row" alignItems="center" gap={12} height={36} paddingBottom="4px">
          <Bleed left="6px" vertical="4px">
            <HyperliquidTokenIcon size={40} symbol={position.symbol} />
          </Bleed>
          <Box gap={12} style={{ flex: 1 }}>
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
        <Bleed horizontal="6px">
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
        </Bleed>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Stack alignHorizontal="left" space={'10px'}>
            <Text size="11pt" weight="bold" color="labelQuaternary">
              {i18n.t(i18n.l.perps.positions.entry)}
            </Text>
            <Text size="15pt" weight="bold" color="labelSecondary">
              {entryPrice}
            </Text>
          </Stack>
          <Stack alignHorizontal="left" space={'10px'}>
            <Text size="11pt" weight="bold" color="labelQuaternary">
              {i18n.t(i18n.l.perps.positions.mark_price)}
            </Text>
            <LiveTokenText
              tokenId={getHyperliquidTokenId(position.symbol)}
              selector={livePriceSelector}
              initialValue={useStableValue(() => useHyperliquidMarketsStore.getState().getFormattedPrice(position.symbol) ?? '-')}
              size="15pt"
              weight="heavy"
              color="label"
            />
          </Stack>
          <Stack alignHorizontal="right" space={'10px'}>
            <Text align="right" size="11pt" weight="bold" color="labelQuaternary">
              {i18n.t(i18n.l.perps.positions.liq_price)}
            </Text>
            <Text align="right" size="15pt" weight="bold" color="labelSecondary">
              {liquidationPrice}
            </Text>
          </Stack>
        </Box>
      </Box>
    </ShadowWrapper>
  );
});

function livePriceSelector(state: TokenData): string {
  return formatPerpAssetPrice(state.price);
}
