import React, { useEffect, useRef } from 'react';

import Animated, { FadeIn } from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenValue } from '@/components/live-token-text/useLiveTokenValue';
import { Box, Text } from '@/design-system';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useTheme } from '@/theme/ThemeContext';

import { calculateSpotPnl, type TokenTrades } from '../core/spotPnl';
import { useSpotPnlTokenId, useTokenTradesStore } from '../data/tokenTradesStore';
import { formatPnlAmount, formatPnlPercentage, PnlArrow, pnlColor, pnlSign } from './pnlDisplay';
import { isSpotPnlEligible } from './spotPnlEligibility';

type SpotPnlPillToken = {
  address: string;
  chainId: ChainId;
  uniqueId: string;
  /** Token units held by the wallet. */
  balance: string;
  initialPrice: string;
  initialPriceUpdatedAt: number;
};

type SpotPnlPillProps = {
  token: SpotPnlPillToken;
  surfaceColor: string;
  /** The metadata token type, since wallet assets do not carry it; the pill stays hidden until it is known. */
  tokenType: string | undefined;
};

/** Unrealized P&L while purchased tokens are held, otherwise realized P&L once they have all been sold. */
export function SpotPnlPill({ token, surfaceColor, tokenType }: SpotPnlPillProps) {
  const isEnabled = useSpotPnlTokenId(Boolean);
  const isEligible = isEnabled && isSpotPnlEligible({ address: token.address, chainId: token.chainId, type: tokenType });

  if (!isEligible) return null;
  return <SpotPnlPillContent token={token} surfaceColor={surfaceColor} />;
}

function SpotPnlPillContent({
  token: { address, balance, chainId, initialPrice, initialPriceUpdatedAt, uniqueId },
  surfaceColor,
}: Omit<SpotPnlPillProps, 'tokenType'>) {
  const { colors } = useTheme();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const fetchedTrades = useTokenTradesStore(state => state.getData());
  const isSettled = useTokenTradesStore(state => state.getStatus('isSuccess') || state.getStatus('isError'));
  const walletAddress = userAssetsStoreManager(state => state.address);
  const codexTokenId = useSpotPnlTokenId();
  const position = `${walletAddress}:${codexTokenId}`;
  const lastTrades = useRef<{ position: string; trades: TokenTrades } | null>(null);
  useEffect(() => {
    if (fetchedTrades) lastTrades.current = { position, trades: fetchedTrades };
  }, [fetchedTrades, position]);
  // A balance change re-keys the query, so keep the same position's last cost basis on screen until the refetch settles
  const retainedTrades = !isSettled && lastTrades.current?.position === position ? lastTrades.current.trades : null;
  const trades = fetchedTrades ?? retainedTrades;
  const usdToNativeRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate);
  const price = useLiveTokenValue({
    tokenId: uniqueId,
    fallback: initialPrice,
    fallbackUpdatedAt: initialPriceUpdatedAt,
  });

  if (!trades || !usdToNativeRate) return null;

  const pnl = calculateSpotPnl({ trades, balance, price: price || '0', usdToNativeRate });
  if (!pnl) return null;

  const isRealized = pnl.variant === 'fullyRealized';
  const { amount, percentage } = isRealized ? pnl.realized : pnl.position;
  const { direction, display } = formatPnlAmount(amount, nativeCurrency);
  const color = pnlColor(direction, colors);
  const sign = pnlSign(direction);

  return (
    <ButtonPressAnimation
      scaleTo={0.94}
      onPress={() => Navigation.handleAction(Routes.SPOT_PNL_SHEET, { address, chainId })}
      style={{ alignSelf: 'center' }}
    >
      <Box
        as={Animated.View}
        entering={FadeIn.duration(160)}
        backgroundColor={surfaceColor}
        borderColor={{ custom: surfaceColor }}
        borderRadius={20}
        borderWidth={1}
        flexDirection="row"
        alignItems="center"
        gap={10}
        height={38}
        paddingLeft="16px"
        paddingRight="10px"
      >
        <Box flexDirection="row" alignItems="center" gap={6}>
          <Text color="labelTertiary" size="15pt" weight="bold">
            {i18n.t(pillLabel(isRealized, direction === 'loss'))}
          </Text>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Box flexDirection="row" alignItems="center" gap={3}>
              {sign && (
                <Text color={color} size="15pt" weight="bold">
                  {sign}
                </Text>
              )}
              <Text color={color} size="15pt" weight="bold">
                {display}
              </Text>
            </Box>
            {percentage !== null && (
              <Box flexDirection="row" alignItems="center" gap={3}>
                <PnlArrow color={color} direction={direction} size="11pt" weight="heavy" />
                <Text color={color} size="15pt" weight="bold">
                  {formatPnlPercentage(percentage)}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
        <Text color="labelQuaternary" size="11pt" weight="heavy">
          {'􀆊'}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

function pillLabel(isRealized: boolean, isLoss: boolean) {
  const labels = i18n.l.expanded_state.asset.spot_pnl;
  if (isRealized) return isLoss ? labels.realized_loss : labels.realized_profit;
  return isLoss ? labels.loss : labels.profit;
}
