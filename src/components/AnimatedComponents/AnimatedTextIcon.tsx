import React from 'react';
import { Box, Bleed, AnimatedText } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { AnimatedTextProps } from '@/design-system/components/Text/AnimatedText';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';

export type AnimatedTextIconProps = {
  align?: 'center' | 'left' | 'right';
  children: AnimatedTextProps['children'];
  color?: TextColor | CustomColor;
  containerSize?: number;
  height?: number;
  hitSlop?: number;
  opacity?: number;
  size: TextSize;
  textStyle?: AnimatedTextProps['style'];
  weight: TextWeight;
  width?: number;
};

export const AnimatedTextIcon = ({
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
}: AnimatedTextIconProps) => {
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
        <AnimatedText align={align} color={color} size={size} style={textStyle} weight={weight}>
          {children}
        </AnimatedText>
      </Box>
    </Bleed>
  );
};
