import React, { ElementRef, forwardRef, ReactNode, useMemo } from 'react';
import { Text as NativeText } from 'react-native';
import { useColorModeValue } from '../../color/ColorModeContext';
import { foreground } from '../../color/palette';
import { createLineHeightFixNode } from '../../typography/createLineHeightFixNode';
import { headingSizes, headingWeights } from '../../typography/typography';

interface HeadingStyle {
  align?: 'center' | 'left' | 'right';
  size?: keyof typeof headingSizes;
  weight?: keyof typeof headingWeights;
}

const useHeadingStyle = ({
  align: textAlign,
  size = 'heading',
  weight = 'heavy',
}: HeadingStyle) => {
  const colorModeValue = useColorModeValue();
  const sizeStyles = headingSizes[size];
  const weightStyles = headingWeights[weight];

  return useMemo(
    () => ({
      lineHeightFixNode: createLineHeightFixNode(sizeStyles.lineHeight),
      textStyle: {
        color: colorModeValue(foreground.neutral),
        textAlign,
        ...sizeStyles,
        ...weightStyles,
      },
    }),
    [sizeStyles, weightStyles, textAlign, colorModeValue]
  );
};

export interface HeadingProps extends HeadingStyle {
  numberOfLines?: number;
  children: ReactNode;
}

export const Heading = forwardRef<ElementRef<typeof NativeText>, HeadingProps>(
  ({ numberOfLines, children, ...textStyleProps }, ref) => {
    const { textStyle, lineHeightFixNode } = useHeadingStyle(textStyleProps);

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

Heading.displayName = 'Heading';
