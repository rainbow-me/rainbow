import React from 'react';
import { Box, BoxProps, Inline, Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { usePositions } from '@/resources/defi/PositionsQuery';
import { PositionCard } from '@/components/positions/PositionsCard';

export default function WrappedClaimable({ uniqueId, placement }: { uniqueId: string; placement: 'left' | 'right' }) {
  // const { accountAddress, nativeCurrency } = useAccountSettings();
  // const { data } = usePositions({
  //   address: accountAddress,
  //   currency: nativeCurrency,
  // });

  // const position = data?.positions.find(position => position.type === uniqueId);

  // const placementProps: BoxProps =
  //   placement === 'left'
  //     ? {
  //         alignItems: 'flex-start',
  //         paddingLeft: '19px (Deprecated)',
  //         paddingRight: '8px',
  //       }
  //     : {
  //         alignItems: 'flex-end',
  //         paddingRight: '19px (Deprecated)',
  //         paddingLeft: '8px',
  //       };

  // if (!position) return null;
  const color = 'rgba(7, 17, 32, 0.02)';
  return (
    <Box padding="20px" justifyContent="center">
      <Inline alignVertical="center">
        <Box style={{ height: 40, width: 40, backgroundColor: 'blue', borderRadius: 11 }}></Box>
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
            $662.72
          </Text>
        </Box>
      </Inline>
    </Box>
  );
}
