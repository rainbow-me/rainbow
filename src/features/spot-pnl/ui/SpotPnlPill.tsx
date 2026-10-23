import React from 'react';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { Box, Text } from '@/design-system';
import { SPOT_PNL } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { isNativeAsset } from '@/handlers/assets';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useTheme } from '@/theme/ThemeContext';

import { calculateSpotPnl } from '../core/spotPnl';
import { useTokenTradesStore } from '../data/tokenTradesStore';
import { formatPnlAmount, formatPnlPercentage, PnlArrow, pnlColor, pnlSign } from './pnlDisplay';

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
  const { spot_pnl_enabled } = useRemoteConfig('spot_pnl_enabled');
  const spotPnlExperimentalEnabled = useExperimentalFlag(SPOT_PNL);
  const isEligible =
    (spot_pnl_enabled || spotPnlExperimentalEnabled) &&
    tokenType !== undefined &&
    tokenType !== 'stablecoin' &&
    !isNativeAsset(token.address, token.chainId);

  if (!isEligible) return null;
  return <SpotPnlPillContent token={token} surfaceColor={surfaceColor} />;
}

function SpotPnlPillContent({
  token: { address, balance, chainId, initialPrice, initialPriceUpdatedAt, uniqueId },
  surfaceColor,
}: Omit<SpotPnlPillProps, 'tokenType'>) {
  const { colors } = useTheme();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  // Subscribing here, behind the eligibility gate, is what triggers the fetch
  const trades = useTokenTradesStore(state => state.getData());
  const usdToNativeRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate);
  const price = useLiveTokenValue({
    tokenId: uniqueId,
    initialValue: initialPrice,
    initialValueLastUpdated: initialPriceUpdatedAt,
    // TODO(APP-4147): The sheet already subscribes this token on this route, and subscriptions do not stack: unmounting a second subscriber would unsubscribe the sheet
    autoSubscriptionEnabled: false,
    selector: token => token.price,
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
        backgroundColor={surfaceColor}
        borderColor={{ custom: surfaceColor }}
        borderRadius={18}
        borderWidth={1}
        flexDirection="row"
        alignItems="center"
        gap={8}
        height={{ custom: 36 }}
        paddingHorizontal="16px"
      >
        <Text color="labelTertiary" size="15pt" weight="bold">
          {i18n.t(pillLabel(isRealized, direction === 'loss'))}
        </Text>
        <Text color={color} size="15pt" weight="heavy" tabularNumbers>
          {sign ? `${sign} ${display}` : display}
        </Text>
        {percentage !== null && (
          <Box flexDirection="row" alignItems="center" gap={2}>
            <PnlArrow color={color} direction={direction} size="15pt" weight="heavy" />
            <Text color={color} size="15pt" weight="heavy" tabularNumbers>
              {formatPnlPercentage(percentage)}
            </Text>
          </Box>
        )}
        <Text color="labelQuaternary" size="13pt" weight="heavy">
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
