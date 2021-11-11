import React, { ElementRef, forwardRef, ReactNode, useMemo } from 'react';
import { Text as NativeText } from 'react-native';
import { useForegroundColor } from '../../color/useForegroundColor';
import { createLineHeightFixNode } from '../../typography/createLineHeightFixNode';
import {
  nodeHasEmoji,
  nodeIsString,
  renderStringWithEmoji,
} from '../../typography/renderStringWithEmoji';
import { headingSizes, headingWeights } from '../../typography/typography';

export type HeadingProps = {
  align?: 'center' | 'left' | 'right';
  size?: keyof typeof headingSizes;
  weight?: keyof typeof headingWeights;
  numberOfLines?: number;
  testID?: string;
} & (
  | {
      containsEmoji: true;
      children: string | (string | null)[]; // This is because we can only process strings automatically. We can't traverse into content rendered by child components.
    }
  | { containsEmoji?: false; children: ReactNode }
);

/**
 * @description Default size is `"20px"`
 */
export const Heading = forwardRef<ElementRef<typeof NativeText>, HeadingProps>(
  function Heading(
    {
      numberOfLines,
      containsEmoji: containsEmojiProp = false,
      children,
      testID,
      align: textAlign,
      size = '20px',
      weight = 'heavy',
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
          'Heading: When "containsEmoji" is set to true, children can only be strings. If you need low-level control of emoji rendering, you can also use the "renderStringWithEmoji" function directly which accepts a string.'
        );
      }
    }

    const sizeStyles = headingSizes[size];
    const weightStyles = headingWeights[weight];
    const color = useForegroundColor('primary');

    const lineHeightFixNode = useMemo(
      () => createLineHeightFixNode(sizeStyles.lineHeight),
      [sizeStyles]
    );

    const textStyle = useMemo(
      () =>
        ({
          color,
          textAlign,
          ...sizeStyles,
          ...weightStyles,
        } as const),
      [sizeStyles, weightStyles, textAlign, color]
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
