import React, { useMemo } from 'react';
import { View } from 'react-native';
import { DividerColor } from '../../color/palettes';
import { useForegroundColor } from '../../color/useForegroundColor';

export interface DividerProps {
  color?: DividerColor;
  direction?: 'horizontal' | 'vertical';
}

/**
 * @description Renders a plain, static text link, designed to be used within a
 * block of text.
 */
export function Divider({
  color = 'divider80',
  direction = 'horizontal',
}: DividerProps) {
  const foregroundColor = useForegroundColor(color);
  const style = useMemo(
    () => [
      {
        backgroundColor: foregroundColor,
        borderRadius: 1,
      },
      direction === 'horizontal' ? { height: 2 } : { flexGrow: 1, width: 2 },
    ],
    [foregroundColor, direction]
  );

  return <View style={style} />;
}
