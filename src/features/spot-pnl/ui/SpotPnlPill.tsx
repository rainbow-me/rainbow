import React from 'react';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { Box, Text } from '@/design-system';
import type { ParsedAddressAsset } from '@/entities/tokens';
import { SPOT_PNL } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { isNativeAsset } from '@/handlers/assets';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useTheme } from '@/theme/ThemeContext';

import { calculateUnrealizedPnl } from '../core/unrealizedPnl';
import { useTokenTradesStore } from '../data/tokenTradesStore';
import { formatPnlAmount, formatPnlPercentage, PnlArrow, pnlColor, pnlSign } from './pnlDisplay';

type SpotPnlPillProps = {
  asset: ParsedAddressAsset;
  surfaceColor: string;
  /** The metadata token type, since wallet assets do not carry it; the pill stays hidden until it is known. */
  tokenType: string | undefined;
};

export function SpotPnlPill({ asset, surfaceColor, tokenType }: SpotPnlPillProps) {
  const { spot_pnl_enabled } = useRemoteConfig('spot_pnl_enabled');
  const spotPnlExperimentalEnabled = useExperimentalFlag(SPOT_PNL);
  const isEligible =
    (spot_pnl_enabled || spotPnlExperimentalEnabled) &&
    tokenType !== undefined &&
    tokenType !== 'stablecoin' &&
    !isNativeAsset(asset.address, asset.chainId);

  if (!isEligible) return null;
  return <SpotPnlPillContent asset={asset} surfaceColor={surfaceColor} />;
}

function SpotPnlPillContent({ asset, surfaceColor }: Omit<SpotPnlPillProps, 'tokenType'>) {
  const { colors } = useTheme();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  // Subscribing here, behind the eligibility gate, is what triggers the fetch
  const trades = useTokenTradesStore(state => state.getData());
  const usdToNativeRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate);
  const price = useLiveTokenValue({
    tokenId: asset.uniqueId,
    initialValue: asset.native?.price?.amount ?? '',
    initialValueLastUpdated: asset.price?.changed_at ?? 0,
    // TODO(APP-4147): The sheet already subscribes this token on this route, and subscriptions do not stack: unmounting a second subscriber would unsubscribe the sheet
    autoSubscriptionEnabled: false,
    selector: token => token.price,
  });

  const balance = asset.balance?.amount;
  if (!trades || !balance || !price || !usdToNativeRate) return null;

  const pnl = calculateUnrealizedPnl({ acquisition: trades, balance, price, usdToNativeRate });
  if (!pnl) return null;

  const { direction, display } = formatPnlAmount(pnl.amount, nativeCurrency);
  const color = pnlColor(direction, colors);
  const sign = pnlSign(direction);

  return (
    <ButtonPressAnimation
      scaleTo={0.94}
      onPress={() => Navigation.handleAction(Routes.SPOT_PNL_SHEET, { address: asset.address, chainId: asset.chainId })}
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
          {i18n.t(direction === 'loss' ? i18n.l.expanded_state.asset.spot_pnl.loss : i18n.l.expanded_state.asset.spot_pnl.profit)}
        </Text>
        <Text color={color} size="15pt" weight="heavy" tabularNumbers>
          {sign ? `${sign} ${display}` : display}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={2}>
          <PnlArrow color={color} direction={direction} size="15pt" weight="heavy" />
          <Text color={color} size="15pt" weight="heavy" tabularNumbers>
            {formatPnlPercentage(pnl.percentage)}
          </Text>
        </Box>
        <Text color="labelQuaternary" size="13pt" weight="heavy">
          {'􀆊'}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}
