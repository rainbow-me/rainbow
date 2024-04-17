import React from 'react';
import { Bleed } from '../Bleed/Bleed';
import { Box } from '../Box/Box';

export type IconContainerProps = {
  children: React.ReactNode;
  height?: number;
  hitSlop?: number;
  opacity?: number;
  size?: number;
  width?: number;
};

export const IconContainer = ({ children, height, hitSlop, opacity, size = 16, width }: IconContainerProps) => {
  // Prevents wide icons from being clipped
  const extraHorizontalSpace = 4;

  return (
    <Bleed
      horizontal={{ custom: (hitSlop || 0) + extraHorizontalSpace }}
      vertical={hitSlop ? { custom: hitSlop } : '6px'}
      space={hitSlop ? { custom: hitSlop } : undefined}
    >
      <Box
        alignItems="center"
        height={{ custom: height || size }}
        justifyContent="center"
        marginHorizontal={hitSlop ? { custom: hitSlop } : undefined}
        marginVertical={{ custom: hitSlop || 6 }}
        style={{ opacity }}
        width={{ custom: (width || size) + extraHorizontalSpace * 2 }}
      >
        {children}
      </Box>
    </Bleed>
  );
};
