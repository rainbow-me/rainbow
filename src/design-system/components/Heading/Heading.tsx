import React, { ElementRef, forwardRef, ReactNode, useMemo } from 'react';
import { Text as NativeText } from 'react-native';

import { CustomColor } from '../../color/useForegroundColor';
import { createLineHeightFixNode } from '../../typography/createLineHeightFixNode';
import {
  nodeHasEmoji,
  nodeIsString,
  renderStringWithEmoji,
} from '../../typography/renderStringWithEmoji';
import {
  headingSizes,
  headingWeights,
  TextColor,
} from '../../typography/typography';
import { useHeadingStyle } from './useHeadingStyle';

export type HeadingProps = {
  align?: 'center' | 'left' | 'right';
  color?: TextColor | CustomColor;
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
      align,
      color,
      numberOfLines,
      containsEmoji: containsEmojiProp = false,
      children,
      testID,
      size,
      weight,
    },
    ref
  ) {
    if (__DEV__) {
      if (!containsEmojiProp && nodeHasEmoji(children)) {
        // eslint-disable-next-line no-console
        console.log(
          `Heading: Emoji characters detected when "containsEmoji" prop isn't set to true: "${children}"\n\nYou should set the "containsEmoji" prop to true, otherwise vertical text alignment will be broken on iOS.`
        );
      }
      if (containsEmojiProp && !nodeIsString(children)) {
        throw new Error(
          'Heading: When "containsEmoji" is set to true, children can only be strings. If you need low-level control of emoji rendering, you can also use the "renderStringWithEmoji" function directly which accepts a string.'
        );
      }
    }

    const headingStyle = useHeadingStyle({ align, color, size, weight });

    const lineHeightFixNode = useMemo(
      () => createLineHeightFixNode(headingStyle.lineHeight),
      [headingStyle]
    );

    return (
      <NativeText
        allowFontScaling={false}
        numberOfLines={numberOfLines}
        ref={ref}
        style={headingStyle}
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
