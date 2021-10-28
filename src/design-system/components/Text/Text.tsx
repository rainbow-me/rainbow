import React, { ElementRef, forwardRef, ReactNode, useMemo } from 'react';
import { Text as NativeText } from 'react-native';
import {
  CustomColor,
  useForegroundColor,
} from '../../color/useForegroundColor';
import { createLineHeightFixNode } from '../../typography/createLineHeightFixNode';
import {
  nodeHasEmoji,
  nodeIsString,
  renderStringWithEmoji,
} from '../../typography/renderStringWithEmoji';
import { textSizes, textWeights } from '../../typography/typography';

const validColors = [
  'action',
  'inverted',
  'primary',
  'secondary',
  'secondary30',
  'secondary40',
  'secondary50',
  'secondary60',
  'secondary70',
  'secondary80',
] as const;

interface TextStyle {
  align?: 'center' | 'left' | 'right';
  color?: typeof validColors[number] | CustomColor;
  size?: keyof typeof textSizes;
  weight?: keyof typeof textWeights;
  tabularNumbers?: boolean;
  uppercase?: boolean;
}

function useTextStyle({
  align: textAlign,
  color = 'primary',
  size = 'body',
  weight = 'regular',
  tabularNumbers = false,
  uppercase = false,
}: TextStyle) {
  if (__DEV__ && typeof color === 'string' && !validColors.includes(color)) {
    throw new Error(`Text: Unsupported color "${color}"`);
  }

  const colorValue = useForegroundColor(color);
  const sizeStyles = textSizes[size];
  const weightStyles = textWeights[weight];

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
  testID?: string;
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
      testID,
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
          'Text: When "containsEmoji" is set to true, children can only be strings. If you need low-level control of emoji rendering, you can also use the "renderStringWithEmoji" function directly which accepts a string.'
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
        testID={testID}
      >
        {ios && containsEmojiProp && nodeIsString(children)
          ? renderStringWithEmoji(children)
          : children}
        {lineHeightFixNode}
      </NativeText>
    );
  }
);
