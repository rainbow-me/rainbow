import React from 'react';
import { Box, BoxProps, Inline, Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { usePositions } from '@/resources/defi/PositionsQuery';
import { PositionCard } from '@/components/positions/PositionsCard';
import { useClaimables } from '@/resources/claimables/claimablesQuery';
import { getIsHardhatConnected } from '@/handlers/web3';
import { FasterImageView } from '@candlefinance/faster-image';

export default function WrappedClaimable({ uniqueId }: { uniqueId: string }) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { data } = useClaimables({
    address: accountAddress,
    currency: nativeCurrency,
    testnetMode: getIsHardhatConnected(),
  });

  const claimable = data?.find(claimable => claimable.name === uniqueId); // FIXME

  if (!claimable) return null;

  const color = 'rgba(7, 17, 32, 0.02)';
  return (
    <Box padding="20px" justifyContent="center">
      <Inline alignVertical="center">
        <FasterImageView
          source={{ url: claimable.dapp.icon_url }}
          style={{ height: 40, width: 40, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.03)' }}
        />
        <Box
          alignItems="center"
          justifyContent="center"
          height={{ custom: 28 }}
          paddingHorizontal="8px"
          borderRadius={12}
          borderWidth={1.333}
          borderColor={{ custom: color }}
          style={{ backgroundColor: color }}
        >
          <Text weight="semibold" color="label" align="center" size="17pt">
            {claimable.amount}
          </Text>
        </Box>
      </Inline>
    </Box>
  );
}
