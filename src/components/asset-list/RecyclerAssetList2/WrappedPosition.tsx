import React from 'react';
import { Box, BoxProps } from '@/design-system';
import { positionsStore } from '@/resources/defi/PositionsQuery';
import { PositionCard } from '@/components/positions/PositionsCard';

export default function WrappedPosition({ uniqueId, placement }: { uniqueId: string; placement: 'left' | 'right' }) {
  const position = positionsStore(state => state.getPosition(uniqueId));

  const placementProps: BoxProps =
    placement === 'left'
      ? {
          alignItems: 'flex-start',
          paddingLeft: '19px (Deprecated)',
          paddingRight: '8px',
        }
      : {
          alignItems: 'flex-end',
          paddingRight: '19px (Deprecated)',
          paddingLeft: '8px',
        };

  if (!position) return null;

  return (
    <Box justifyContent="center" testID={`wrapped-position-${position.type}`} {...placementProps}>
      <PositionCard position={position} />
    </Box>
  );
}
