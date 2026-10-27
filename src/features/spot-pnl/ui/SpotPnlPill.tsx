import React, { useEffect, useRef } from 'react';

import Animated, { FadeIn } from 'react-native-reanimated';

import { useLiveTokenValue } from '@/components/live-token-text/useLiveTokenValue';
import { Box, Text } from '@/design-system';
import type { ParsedAddressAsset } from '@/entities/tokens';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { DOWN_ARROW, UP_ARROW } from '@/features/market/ui/utils/formatPriceChange';
import { lessThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { isNativeAsset } from '@/handlers/assets';
import * as i18n from '@/languages';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useTheme } from '@/theme/ThemeContext';

import { calculateUnrealizedPnl, type TokenAcquisition } from '../core/unrealizedPnl';
import { useSpotPnlTokenId, useTokenAcquisitionStore } from '../data/tokenAcquisitionStore';

type SpotPnlPillProps = {
  asset: ParsedAddressAsset;
  surfaceColor: string;
  /** The metadata token type, since wallet assets do not carry it; the pill stays hidden until it is known. */
  tokenType: string | undefined;
};

export function SpotPnlPill({ asset, surfaceColor, tokenType }: SpotPnlPillProps) {
  const isEnabled = useSpotPnlTokenId(Boolean);
  const isEligible = isEnabled && tokenType !== undefined && tokenType !== 'stablecoin' && !isNativeAsset(asset.address, asset.chainId);

  if (!isEligible) return null;
  return <SpotPnlPillContent asset={asset} surfaceColor={surfaceColor} />;
}

function SpotPnlPillContent({ asset, surfaceColor }: Omit<SpotPnlPillProps, 'tokenType'>) {
  const { colors } = useTheme();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  // Subscribing here, behind the eligibility gate, is what triggers the fetch
  const fetchedAcquisition = useTokenAcquisitionStore(state => state.getData());
  const isSettled = useTokenAcquisitionStore(state => state.getStatus('isSuccess') || state.getStatus('isError'));
  const walletAddress = userAssetsStoreManager(state => state.address);
  const codexTokenId = useSpotPnlTokenId();
  const position = `${walletAddress}:${codexTokenId}`;
  const lastAcquisition = useRef<{ position: string; acquisition: TokenAcquisition } | null>(null);
  useEffect(() => {
    if (fetchedAcquisition) lastAcquisition.current = { position, acquisition: fetchedAcquisition };
  }, [fetchedAcquisition, position]);
  // A balance change re-keys the query, so keep the same position's last cost basis on screen until the refetch settles
  const retainedAcquisition = !isSettled && lastAcquisition.current?.position === position ? lastAcquisition.current.acquisition : null;
  const acquisition = fetchedAcquisition ?? retainedAcquisition;
  const usdToNativeRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate);
  const price = useLiveTokenValue({
    tokenId: asset.uniqueId,
    fallback: asset.native?.price?.amount ?? '',
    fallbackUpdatedAt: asset.price?.changed_at ?? 0,
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
      as={Animated.View}
      entering={FadeIn.duration(160)}
      style={{ alignSelf: 'center' }}
      backgroundColor={surfaceColor}
      borderColor={{ custom: surfaceColor }}
      borderRadius={18}
      borderWidth={1}
      flexDirection="row"
      alignItems="center"
      gap={8}
      height={36}
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
          <Text color={color} size="15pt" weight="heavy">
            {isLoss ? DOWN_ARROW : UP_ARROW}
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
