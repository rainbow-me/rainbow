import React from 'react';
import { Bleed } from '../Bleed/Bleed';
import { Box } from '../Box/Box';

export const IconContainer = ({
  children,
  hitSlop,
  opacity,
  size = 16,
}: {
  children: React.ReactNode;
  hitSlop?: number;
  opacity?: number;
  size?: number;
}) => {
  // Prevent wide icons from being clipped
  const extraHorizontalSpace = 4;

  return (
    <Bleed
      horizontal={{ custom: (hitSlop || 0) + extraHorizontalSpace }}
      vertical={hitSlop ? { custom: hitSlop } : '6px'}
      space={hitSlop ? { custom: hitSlop } : undefined}
    >
      <Box
        alignItems="center"
        height={{ custom: size }}
        justifyContent="center"
        marginHorizontal={hitSlop ? { custom: hitSlop } : undefined}
        marginVertical={{ custom: hitSlop || 6 }}
        style={{ opacity }}
        width={{ custom: size + extraHorizontalSpace * 2 }}
      >
        {children}
      </Box>
    </Bleed>
  );
};
