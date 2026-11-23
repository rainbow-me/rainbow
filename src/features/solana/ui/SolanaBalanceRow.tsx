import React, { memo, useState } from 'react';

import { FasterImageView } from '@candlefinance/faster-image';

import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { Box, Text } from '@/design-system';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { ChainImage } from '@/features/network/components/ChainImage';
import { SOLANA_NETWORK_BADGE } from '@/features/solana/constants/networkAssets';
import { selectSolanaBalance, useSolanaWalletBalances } from '@/features/solana/data/solanaBalancesStore';
import { toSignificantDigits } from '@/helpers/utilities';
import { useTheme } from '@/theme/ThemeContext';
import { shallowEqual } from '@/worklets/comparisons';

export const SolanaBalanceRow = memo(function SolanaBalanceRow({ uniqueId }: { uniqueId: string }) {
  const balance = useSolanaWalletBalances(state => selectSolanaBalance(state, uniqueId), shallowEqual);
  const currency = useSolanaWalletBalances(state => state.currency);
  const theme = useTheme();
  const [failedIconUrl, setFailedIconUrl] = useState<string>();
  if (!balance) return null;
  const change = balance.relativeChange24h;
  const changeDisplay =
    change === undefined
      ? '-'
      : `${toSignificantDigits({ value: change, minDecimalPlaces: 2, minRepresentable: 0.01 }).replace('-', '- ')}%`;
  return (
    <Box
      height={{ custom: 70 }}
      paddingHorizontal="20px"
      flexDirection="row"
      alignItems="center"
      gap={12}
      accessible
      accessibilityLabel={`${balance.name}, ${balance.amount} ${balance.rawUnits ? 'base units' : balance.symbol}, Solana`}
      testID={`solana-balance-${balance.assetId}`}
    >
      <Box width={{ custom: 40 }} height={{ custom: 40 }}>
        {balance.iconUrl && failedIconUrl !== balance.iconUrl ? (
          // Codex URLs must bypass the image proxy, which currently rejects this host.
          <FasterImageView
            source={{ ...DEFAULT_FASTER_IMAGE_CONFIG, url: balance.iconUrl, borderRadius: 20 }}
            style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden' }}
            onError={() => setFailedIconUrl(balance.iconUrl)}
          />
        ) : (
          <Box
            width={{ custom: 40 }}
            height={{ custom: 40 }}
            borderRadius={20}
            background="fillSecondary"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="labelSecondary" size="17pt" weight="bold">
              {balance.symbol.slice(0, 1)}
            </Text>
          </Box>
        )}
        <ChainImage chainId={null} badgeSource={SOLANA_NETWORK_BADGE} size={20} badgeXPosition={-10} />
      </Box>
      <Box flexShrink={1} flexGrow={1} gap={8}>
        <Text color="label" size="17pt" weight="semibold" numberOfLines={1}>
          {balance.name}
        </Text>
        <Text color="labelTertiary" size="13pt" weight="medium" numberOfLines={1}>
          {balance.amount} {balance.rawUnits ? 'base units' : balance.symbol}
        </Text>
      </Box>
      <Box alignItems="flex-end" gap={8}>
        <Text color="labelSecondary" size="15pt" weight="semibold">
          {convertAmountToNativeDisplay(balance.value ?? '0', currency)}
        </Text>
        <Text
          color={{ custom: change !== undefined && change > 0 ? theme.colors.green : theme.colors.blueGreyDark50 }}
          size="13pt"
          weight="medium"
        >
          {changeDisplay}
        </Text>
      </Box>
    </Box>
  );
});
