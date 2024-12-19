import React, { ElementRef, forwardRef, useMemo } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import AnimateableText from 'react-native-animateable-text';
import { DerivedValue, SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { TextColor } from '../../color/palettes';
import { CustomColor } from '../../color/useForegroundColor';
import { createLineHeightFixNode } from '../../typography/createLineHeightFixNode';
import { TextSize, TextWeight } from './Text';
import { useTextStyle } from './useTextStyle';

export type SharedOrDerivedValueText =
  | (SharedValue<string> | DerivedValue<string>)
  | (SharedValue<string | null> | DerivedValue<string | null>)
  | (SharedValue<string | undefined> | DerivedValue<string | undefined>)
  | (SharedValue<string | null | undefined> | DerivedValue<string | null | undefined>);

export type AnimatedTextProps = {
  align?: 'center' | 'left' | 'right';
  children?: SharedOrDerivedValueText | string | null | undefined;
  color?: TextColor | CustomColor;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip' | undefined;
  numberOfLines?: number;
  selectable?: boolean;
  size: TextSize;
  /**
   * @deprecated
   * Use `children` instead, which now accepts either a string or a shared value that holds a string.
   */
  staticText?: string;
  tabularNumbers?: boolean;
  /**
   * @deprecated
   * You can now pass in a value like this:
   *
   * ```
   * <AnimatedText>
   *   {derivedOrSharedValue}
   * </AnimatedText>
   * ```
   *
   * `derivedOrSharedValue` should be a Reanimated shared or derived value.
   *
   * To create a derived value, use the `useDerivedValue` hook from 'react-native-reanimated'.
   * For example:
   * ```
   * const text = useDerivedValue(() => `Hello ${someOtherValue.value}`);
   * ```
   **/
  text?: SharedOrDerivedValueText;
  testID?: string;
  uppercase?: boolean;
  weight?: TextWeight;
} & {
  style?: StyleProp<TextStyle>;
};

export const AnimatedText = forwardRef<ElementRef<typeof AnimateableText>, AnimatedTextProps>(function Text(
  {
    align,
    children,
    color = 'label',
    ellipsizeMode,
    numberOfLines,
    selectable,
    size,
    staticText,
    tabularNumbers,
    testID,
    text,
    uppercase,
    weight,
    style,
  },
  ref
) {
  const textStyle = useTextStyle({
    align,
    color,
    size,
    tabularNumbers,
    uppercase,
    weight,
  });

  const lineHeightFixNode = useMemo(() => createLineHeightFixNode(textStyle.lineHeight), [textStyle]);

  const animatedText = useAnimatedProps(() => {
    return {
      text: typeof children === 'string' ? children : children?.value ?? text?.value ?? staticText ?? '',
    };
  });

  return (
    <AnimateableText
      allowFontScaling={false}
      animatedProps={animatedText}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      ref={ref}
      selectable={selectable}
      style={[textStyle, style || {}]}
      testID={testID}
    >
      {lineHeightFixNode}
    </AnimateableText>
  );
});
