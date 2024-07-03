import React from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { AlignHorizontal, alignHorizontalToFlexAlign, AlignVertical, alignVerticalToFlexAlign } from '../../layout/alignment';
import { Box, BoxProps } from '../Box/Box';

export type CoverProps = {
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
  children?: BoxProps['children'];
  pointerEvents?: ViewProps['pointerEvents'];
  style?: StyleProp<ViewStyle>;
};

/**
 * @description Renders an absolutely filled container relative to its parent.
 */
export function Cover({ alignVertical, alignHorizontal, children, pointerEvents, style }: CoverProps) {
  return (
    <Box
      alignItems={alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined}
      bottom="0px"
      flexDirection="row"
      justifyContent={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}
      left="0px"
      pointerEvents={pointerEvents}
      position="absolute"
      right="0px"
      style={style}
      top="0px"
    >
      {children}
    </Box>
  );
}
