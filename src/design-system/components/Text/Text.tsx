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
import {
  TextColor,
  textColors,
  textSizes,
  textWeights,
} from '../../typography/typography';

export type TextProps = {
  align?: 'center' | 'left' | 'right';
  color?: TextColor | CustomColor;
  numberOfLines?: number;
  size?: keyof typeof textSizes;
  tabularNumbers?: boolean;
  testID?: string;
  uppercase?: boolean;
  weight?: keyof typeof textWeights;
} & (
  | {
      containsEmoji: true;
      children: string | (string | null)[];
    }
  | { containsEmoji?: false; children: ReactNode }
);

/**
 * @description Default size is `"16px"`
 */
export const Text = forwardRef<ElementRef<typeof NativeText>, TextProps>(
  function Text(
    {
      numberOfLines,
      containsEmoji: containsEmojiProp = false,
      children,
      testID,
      align: textAlign,
      color = 'primary',
      size = '16px',
      weight = 'regular',
      tabularNumbers = false,
      uppercase = false,
    },
    ref
  ) {
    if (__DEV__) {
      if (!containsEmojiProp && nodeHasEmoji(children)) {
        // eslint-disable-next-line no-console
        console.log(
          `Text: Emoji characters detected when "containsEmoji" prop isn't set to true: "${children}"\n\nYou should set the "containsEmoji" prop to true, otherwise vertical text alignment will be broken on iOS.`
        );
      }

      if (containsEmojiProp && !nodeIsString(children)) {
        throw new Error(
          'Text: When "containsEmoji" is set to true, children can only be strings. If you need low-level control of emoji rendering, you can also use the "renderStringWithEmoji" function directly which accepts a string.'
        );
      }

      if (color && typeof color === 'string' && !textColors.includes(color)) {
        throw new Error(
          `Text: Invalid color "${color}". Valid colors are: ${textColors
            .map(x => `"${x}"`)
            .join(', ')}`
        );
      }
    }

    const colorValue = useForegroundColor(color);
    const sizeStyles = textSizes[size];
    const weightStyles = textWeights[weight];

    const lineHeightFixNode = useMemo(
      () => createLineHeightFixNode(sizeStyles.lineHeight),
      [sizeStyles]
    );

    const textStyle = useMemo(
      () =>
        ({
          color: colorValue,
          textAlign,
          ...sizeStyles,
          ...weightStyles,
          ...(uppercase ? { textTransform: 'uppercase' as const } : null),
          ...(tabularNumbers
            ? { fontVariant: ['tabular-nums' as const] }
            : null),
        } as const),
      [
        sizeStyles,
        weightStyles,
        textAlign,
        colorValue,
        tabularNumbers,
        uppercase,
      ]
    );

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
