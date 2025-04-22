import React from 'react';
import { Box, BoxProps } from '@/design-system';
import { PositionCard } from '@/components/positions/PositionsCard';
import { RainbowPosition } from '@/resources/defi/types';

export default function WrappedPosition({ position, placement }: { position: RainbowPosition; placement: 'left' | 'right' }) {
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
