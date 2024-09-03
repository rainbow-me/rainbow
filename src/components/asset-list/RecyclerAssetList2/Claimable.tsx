import React from 'react';
import { Box, Inline, Stack, Text } from '@/design-system';
import { useAccountSettings, useDimensions } from '@/hooks';
import { useClaimables } from '@/resources/claimables/claimablesQuery';
import { getIsHardhatConnected } from '@/handlers/web3';
import { FasterImageView } from '@candlefinance/faster-image';
import { ButtonPressAnimation } from '@/components/animations';

export default function Claimable({ uniqueId }: { uniqueId: string }) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { data } = useClaimables({
    address: accountAddress,
    currency: nativeCurrency,
    testnetMode: getIsHardhatConnected(),
  });
  const { width: deviceWidth } = useDimensions();

  const claimable = data?.find(claimable => claimable.uniqueId === uniqueId);

  if (!claimable) return null;

  return (
    <Box
      as={ButtonPressAnimation}
      scaleTo={0.96}
      paddingHorizontal="20px"
      justifyContent="space-between"
      alignItems="center"
      flexDirection="row"
    >
      <Inline alignVertical="center" space="12px">
        <FasterImageView
          source={{ url: claimable.iconUrl }}
          style={{ height: 40, width: 40, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.03)' }}
        />
        <Stack space={{ custom: 11 }}>
          <Text weight="semibold" color="label" size="17pt" ellipsizeMode="tail" numberOfLines={1} style={{ maxWidth: deviceWidth - 220 }}>
            {claimable.name}
          </Text>
          <Text weight="semibold" color="labelTertiary" size="13pt">
            {claimable.value.claimAsset.display}
          </Text>
        </Stack>
      </Inline>
      <Box
        alignItems="center"
        justifyContent="center"
        height={{ custom: 28 }}
        paddingHorizontal="8px"
        borderRadius={12}
        borderWidth={1.333}
        borderColor={{ custom: 'rgba(7, 17, 32, 0.02)' }}
        style={{ backgroundColor: 'rgba(7, 17, 32, 0.02)' }}
      >
        <Text weight="semibold" color="label" align="center" size="17pt">
          {claimable.value.nativeAsset.display}
        </Text>
      </Box>
    </Box>
  );
}
