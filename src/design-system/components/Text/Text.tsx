import React, { ElementRef, forwardRef, ReactNode, useMemo } from 'react';
import { Text as NativeText } from 'react-native';
import { useColorModeValue } from '../../color/ColorModeContext';
import { foreground } from '../../color/palette';
import { createLineHeightFixNode } from '../../typography/createLineHeightFixNode';
import { textSizes, textWeights } from '../../typography/typography';

const colors = {
  neutral: foreground.neutral,
  secondary: foreground.secondary,
  secondary30: foreground.secondary30,
  secondary40: foreground.secondary40,
  secondary50: foreground.secondary50,
  secondary60: foreground.secondary60,
  secondary70: foreground.secondary70,
  secondary80: foreground.secondary80,
} as const;

interface TextStyle {
  align?: 'center' | 'left' | 'right';
  color?: keyof typeof colors;
  size?: keyof typeof textSizes;
  weight?: keyof typeof textWeights;
  tabularNumbers?: boolean;
  uppercase?: boolean;
}

const useTextStyle = ({
  align: textAlign,
  color = 'neutral',
  size = 'body',
  weight = 'bold',
  tabularNumbers = false,
  uppercase = false,
}: TextStyle) => {
  const colorModeValue = useColorModeValue();
  const sizeStyles = textSizes[size];
  const weightStyles = textWeights[weight];

  return useMemo(
    () => ({
      lineHeightFixNode: createLineHeightFixNode(sizeStyles.lineHeight),
      textStyle: {
        color: colorModeValue(colors[color]),
        textAlign,
        ...sizeStyles,
        ...weightStyles,
        ...(uppercase ? { textTransform: 'uppercase' as const } : null),
        ...(tabularNumbers ? { fontVariant: ['tabular-nums' as const] } : null),
      },
    }),
    [
      sizeStyles,
      weightStyles,
      textAlign,
      colorModeValue,
      color,
      tabularNumbers,
      uppercase,
    ]
  );
};

export interface TextProps extends TextStyle {
  numberOfLines?: number;
  children: ReactNode;
}

export const Text = forwardRef<ElementRef<typeof NativeText>, TextProps>(
  ({ numberOfLines, children, ...textStyleProps }, ref) => {
    const { textStyle, lineHeightFixNode } = useTextStyle(textStyleProps);

    return (
      <NativeText
        allowFontScaling={false}
        numberOfLines={numberOfLines}
        ref={ref}
        style={textStyle}
      >
        {children}
        {lineHeightFixNode}
      </NativeText>
    );
  }
);

Text.displayName = 'Text';
