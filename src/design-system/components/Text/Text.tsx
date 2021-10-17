import React, { ElementRef, forwardRef, ReactNode, useMemo } from 'react';
import { Text as NativeText } from 'react-native';
import { ColorModeValue, useColorModeValue } from '../../color/ColorModeValue';
import { foregroundPalette } from '../../color/palette';
import { createLineHeightFixNode } from '../../typography/createLineHeightFixNode';
import {
  nodeHasEmoji,
  nodeIsString,
  renderEmoji,
} from '../../typography/renderEmoji';
import { textSizes, textWeights } from '../../typography/typography';

const textColors = {
  action: foregroundPalette.action,
  neutral: foregroundPalette.neutral,
  secondary: foregroundPalette.secondary,
  secondary30: foregroundPalette.secondary30,
  secondary40: foregroundPalette.secondary40,
  secondary50: foregroundPalette.secondary50,
  secondary60: foregroundPalette.secondary60,
  secondary70: foregroundPalette.secondary70,
  secondary80: foregroundPalette.secondary80,
  white: foregroundPalette.white,
} as const;

interface TextStyle {
  align?: 'center' | 'left' | 'right';
  color?: keyof typeof textColors | { custom: ColorModeValue<string> };
  size?: keyof typeof textSizes;
  weight?: keyof typeof textWeights;
  tabularNumbers?: boolean;
  uppercase?: boolean;
}

function useTextStyle({
  align: textAlign,
  color = 'neutral',
  size = 'body',
  weight = 'regular',
  tabularNumbers = false,
  uppercase = false,
}: TextStyle) {
  const colorModeValue = useColorModeValue();
  const sizeStyles = textSizes[size];
  const weightStyles = textWeights[weight];
  const colorValue = colorModeValue(
    typeof color === 'object' ? color.custom : textColors[color]
  );

  return useMemo(
    () =>
      ({
        lineHeightFixNode: createLineHeightFixNode(sizeStyles.lineHeight),
        textStyle: {
          color: colorValue,
          textAlign,
          ...sizeStyles,
          ...weightStyles,
          ...(uppercase ? { textTransform: 'uppercase' as const } : null),
          ...(tabularNumbers
            ? { fontVariant: ['tabular-nums' as const] }
            : null),
        },
      } as const),
    [sizeStyles, weightStyles, textAlign, colorValue, tabularNumbers, uppercase]
  );
}

export type TextProps = TextStyle & {
  numberOfLines?: number;
} & (
    | {
        containsEmoji: true;
        children: string | (string | null)[];
      }
    | { containsEmoji?: false; children: ReactNode }
  );

export const Text = forwardRef<ElementRef<typeof NativeText>, TextProps>(
  function Text(
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
          `Text: Emoji characters detected when "containsEmoji" prop isn't set to true: "${children}"\n\nYou must set the "containsEmoji" prop to true, otherwise vertical text alignment will be broken on iOS.`
        );
      }
      if (containsEmojiProp && !nodeIsString(children)) {
        throw new Error(
          'Text: When "containsEmoji" is set to true, children can only be strings. If you need low-level control of emoji rendering, you can also use the "renderEmoji" function directly which accepts a string.'
        );
      }
    }

    const { textStyle, lineHeightFixNode } = useTextStyle(textStyleProps);

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
