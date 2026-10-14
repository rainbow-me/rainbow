import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { Box, Text } from '@/design-system';
import type { ParsedAddressAsset } from '@/entities/tokens';
import { SPOT_PNL } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { lessThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { isNativeAsset } from '@/handlers/assets';
import * as i18n from '@/languages';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useTheme } from '@/theme/ThemeContext';

import { calculateUnrealizedPnl } from '../core/unrealizedPnl';
import { useTokenAcquisitionStore, type TokenAcquisitionParams } from '../data/tokenAcquisitionStore';

const UP_ARROW = Platform.OS === 'android' ? '' : '↑';

type SpotPnlPillProps = {
  asset: ParsedAddressAsset;
  surfaceColor: string;
  /** The metadata token type, since wallet assets do not carry it; the pill stays hidden until it is known. */
  tokenType: string | undefined;
};

export function SpotPnlPill({ asset, surfaceColor, tokenType }: SpotPnlPillProps) {
  const { spot_pnl_enabled } = useRemoteConfig('spot_pnl_enabled');
  const spotPnlExperimentalEnabled = useExperimentalFlag(SPOT_PNL);
  const walletAddress = userAssetsStoreManager(state => state.address);
  const isEligible =
    (spot_pnl_enabled || spotPnlExperimentalEnabled) &&
    tokenType !== undefined &&
    tokenType !== 'stablecoin' &&
    !isNativeAsset(asset.address, asset.chainId);

  if (!isEligible || !walletAddress) return null;
  return <SpotPnlPillContent asset={asset} surfaceColor={surfaceColor} walletAddress={walletAddress} />;
}

function SpotPnlPillContent({ asset, surfaceColor, walletAddress }: Omit<SpotPnlPillProps, 'tokenType'> & { walletAddress: string }) {
  const { colors } = useTheme();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const params = useMemo<TokenAcquisitionParams>(
    () => ({ walletAddress, tokenAddress: asset.address, chainId: asset.chainId }),
    [asset.address, asset.chainId, walletAddress]
  );

  useEffect(() => {
    // The store is disabled, so a plain fetch is a no-op; this fetches and caches by params
    useTokenAcquisitionStore.getState().fetch(params, { skipStoreUpdates: 'withCache' });
  }, [params]);

  const acquisition = useTokenAcquisitionStore(state => state.getData(params));
  const usdToNativeRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate);
  const price = useLiveTokenValue({
    tokenId: asset.uniqueId,
    initialValue: asset.native?.price?.amount ?? '',
    initialValueLastUpdated: asset.price?.changed_at ?? 0,
    // The sheet already subscribes this token on this route, and subscriptions do not stack: unmounting a second subscriber would unsubscribe the sheet
    autoSubscriptionEnabled: false,
    selector: token => token.price,
  });

  const balance = asset.balance?.amount;
  if (!acquisition || !balance || !price || !usdToNativeRate) return null;

  const pnl = calculateUnrealizedPnl({ acquisition, balance, price, usdToNativeRate });
  if (!pnl) return null;

  const isLoss = lessThanWorklet(pnl.amount, 0);
  const amountDisplay = convertAmountToNativeDisplay(pnl.amount.replace('-', ''), nativeCurrency);
  const isZero = amountDisplay === convertAmountToNativeDisplay(0, nativeCurrency);
  const color = isZero ? 'labelSecondary' : { custom: isLoss ? colors.red : colors.green };
  const sign = isZero ? '' : isLoss ? '- ' : '+ ';

  return (
    <Box
      style={{ alignSelf: 'center' }}
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
        {i18n.t(isLoss && !isZero ? i18n.l.expanded_state.asset.spot_pnl.loss : i18n.l.expanded_state.asset.spot_pnl.profit)}
      </Text>
      <Text color={color} size="15pt" weight="heavy" tabularNumbers>
        {`${sign}${amountDisplay}`}
      </Text>
      <Box flexDirection="row" alignItems="center" gap={2}>
        {!isZero && (
          <Text color={color} size="15pt" weight="heavy" style={isLoss ? { transform: [{ rotate: '180deg' }] } : undefined}>
            {UP_ARROW}
          </Text>
        )}
        <Text color={color} size="15pt" weight="heavy" tabularNumbers>
          {`${toFixedWorklet(pnl.percentage.replace('-', ''), 2)}%`}
        </Text>
      </Box>
      <Text color="labelQuaternary" size="13pt" weight="heavy">
        {'􀆊'}
      </Text>
    </Box>
  );
}
