import React from 'react';
import {
  AlignHorizontal,
  alignHorizontalToFlexAlign,
  AlignVertical,
  alignVerticalToFlexAlign,
} from '../../layout/alignment';
import { Box, BoxProps } from '../Box/Box';

export type CoverProps = {
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
  children: BoxProps['children'];
};

/**
 * @description Renders an absolutely filled container relative to its parent.
 */
export function Cover({
  alignVertical,
  alignHorizontal,
  children,
}: CoverProps) {
  return (
    <Box
      alignItems={
        alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined
      }
      bottom="0px"
      flexDirection="row"
      justifyContent={
        alignHorizontal
          ? alignHorizontalToFlexAlign[alignHorizontal]
          : undefined
      }
      left="0px"
      position="absolute"
      right="0px"
      top="0px"
    >
      {children}
    </Box>
  );
}
