import React, { ElementRef, forwardRef, ReactNode, useMemo } from 'react';
import { Text as NativeText } from 'react-native';
import { useColorModeValue } from '../../color/ColorModeValue';
import { foregroundPalette } from '../../color/palette';
import { createLineHeightFixNode } from '../../typography/createLineHeightFixNode';
import {
  nodeHasEmoji,
  nodeIsString,
  renderEmoji,
} from '../../typography/renderEmoji';
import { headingSizes, headingWeights } from '../../typography/typography';

interface HeadingStyle {
  align?: 'center' | 'left' | 'right';
  size?: keyof typeof headingSizes;
  weight?: keyof typeof headingWeights;
}

function useHeadingStyle({
  align: textAlign,
  size = 'heading',
  weight = 'heavy',
}: HeadingStyle) {
  const colorModeValue = useColorModeValue();
  const sizeStyles = headingSizes[size];
  const weightStyles = headingWeights[weight];

  return useMemo(
    () =>
      ({
        lineHeightFixNode: createLineHeightFixNode(sizeStyles.lineHeight),
        textStyle: {
          color: colorModeValue(foregroundPalette.neutral),
          textAlign,
          ...sizeStyles,
          ...weightStyles,
        },
      } as const),
    [sizeStyles, weightStyles, textAlign, colorModeValue]
  );
}

export type HeadingProps = HeadingStyle & {
  numberOfLines?: number;
} & (
    | {
        containsEmoji: true;
        children: string | (string | null)[];
      }
    | { containsEmoji?: false; children: ReactNode }
  );

export const Heading = forwardRef<ElementRef<typeof NativeText>, HeadingProps>(
  function Heading(
    {
      numberOfLines,
      containsEmoji: containsEmojiProp = false,
      children,
      ...textStyleProps
    },
    ref
  ) {
    if (__DEV__) {
      if (!containsEmojiProp && nodeHasEmoji(children)) {
        throw new Error(
          `Heading: Emoji characters detected when "containsEmoji" prop isn't set to true: "${children}"\n\nYou must set the "containsEmoji" prop to true, otherwise vertical text alignment will be broken on iOS.`
        );
      }
      if (containsEmojiProp && !nodeIsString(children)) {
        throw new Error(
          'Heading: When "containsEmoji" is set to true, children can only be strings. If you need low-level control of emoji rendering, you can also use the "renderEmoji" function directly which accepts a string.'
        );
      }
    }

    const { textStyle, lineHeightFixNode } = useHeadingStyle(textStyleProps);

    return (
      <NativeText
        allowFontScaling={false}
        numberOfLines={numberOfLines}
        ref={ref}
        style={textStyle}
      >
        {ios && containsEmojiProp && nodeIsString(children)
          ? renderEmoji(children)
          : children}
        {lineHeightFixNode}
      </NativeText>
    );
  }
);
