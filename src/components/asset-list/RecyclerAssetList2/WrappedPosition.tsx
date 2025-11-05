import React from 'react';
import { Box, BoxProps } from '@/design-system';
import { PositionCard } from '@/features/positions/components/PositionCard';
import { RainbowPosition } from '@/features/positions/types';

type Props = {
  position: RainbowPosition;
  placement: 'left' | 'right';
};

function WrappedPosition({ position, placement }: Props) {
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

export default React.memo(WrappedPosition);
