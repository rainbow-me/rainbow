import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SeparatorColor } from '../../color/palettes';
import { useForegroundColor } from '../../color/useForegroundColor';

export interface SeparatorProps {
  color: SeparatorColor;
  direction?: 'horizontal' | 'vertical';
}

/**
 * @description Renders a separator, either horizontal or vertical.
 */
export function Separator({ color, direction = 'horizontal' }: SeparatorProps) {
  const foregroundColor = useForegroundColor(color ?? 'separator'); // Fallback for JS consumers
  const style = useMemo(
    () => ({
      backgroundColor: foregroundColor,
      borderRadius: 1,
      ...(direction === 'horizontal'
        ? {
            height: 2,
          }
        : {
            flexGrow: 1,
            width: 2,
          }),
    }),
    [foregroundColor, direction]
  );

  return <View style={style} />;
}
