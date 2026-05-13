import React from 'react';

import { type DerivedValue, type SharedValue } from 'react-native-reanimated';

import { AnimatedText, Bleed, Box } from '@/design-system';
import { type TextColor } from '@/design-system/color/palettes';
import { type CustomColor } from '@/design-system/color/useForegroundColor';
import {
  type AnimatedTextChildProps,
  type AnimatedTextProps,
  type AnimatedTextSelectorProps,
} from '@/design-system/components/Text/AnimatedText';
import { type TextWeight } from '@/design-system/components/Text/Text';
import { type TextSize } from '@/design-system/typography/typeHierarchy';

type AnimatedTextIconFrameProps = {
  align?: 'center' | 'left' | 'right';
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

export type AnimatedTextIconProps<T extends SharedValue | DerivedValue = SharedValue | DerivedValue> = AnimatedTextIconFrameProps &
  (AnimatedTextChildProps | AnimatedTextSelectorProps<T>);

export function AnimatedTextIcon<T extends SharedValue | DerivedValue = SharedValue | DerivedValue>({
  align = 'center',
  children,
  color,
  containerSize = 16,
  height,
  hitSlop,
  opacity,
  size,
  selector,
  textStyle,
  weight,
  width,
}: AnimatedTextIconProps<T>) {
  // Prevent wide icons from being clipped
  const extraHorizontalSpace = 8;

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
        {selector ? (
          <AnimatedText align={align} color={color} selector={selector} size={size} style={textStyle} weight={weight}>
            {children}
          </AnimatedText>
        ) : (
          <AnimatedText align={align} color={color} size={size} style={textStyle} weight={weight}>
            {children}
          </AnimatedText>
        )}
      </Box>
    </Bleed>
  );
}
