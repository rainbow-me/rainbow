import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { TextColor } from '../../color/palettes';
import { CustomColor } from '../../color/useForegroundColor';
import { Bleed } from '../Bleed/Bleed';
import { Box } from '../Box/Box';
import { Text, TextSize, TextWeight } from '../Text/Text';

export type TextIconProps = {
  align?: 'center' | 'left' | 'right';
  children: string | (string | null)[] | React.ReactNode;
  color: TextColor | CustomColor;
  containerSize?: number;
  height?: number;
  hitSlop?: number;
  opacity?: number;
  size: TextSize;
  textStyle?: StyleProp<TextStyle>;
  weight: TextWeight;
  width?: number;
};

export const TextIcon = ({
  align = 'center',
  children,
  color,
  containerSize = 16,
  height,
  hitSlop,
  opacity,
  size,
  textStyle,
  weight,
  width,
}: TextIconProps) => {
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
        height={{ custom: height || containerSize }}
        justifyContent="center"
        marginHorizontal={hitSlop ? { custom: hitSlop } : undefined}
        marginVertical={{ custom: hitSlop || 6 }}
        style={{ opacity }}
        width={{ custom: (width || containerSize) + extraHorizontalSpace * 2 }}
      >
        <Text align={align} color={color} size={size} style={textStyle} weight={weight}>
          {children}
        </Text>
      </Box>
    </Bleed>
  );
};
