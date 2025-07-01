import React, { ElementRef, ReactNode, Ref, RefAttributes, forwardRef, useMemo } from 'react';
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

export type AnimatedTextProps<T extends SharedValue | DerivedValue = SharedValue | DerivedValue> = {
  align?: 'center' | 'left' | 'right';
  color?: TextColor | CustomColor;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip' | undefined;
  numberOfLines?: number;
  selectable?: boolean;
  size: TextSize;
  style?: StyleProp<TextStyle>;
  tabularNumbers?: boolean;
  testID?: string;
  uppercase?: boolean;
  weight?: TextWeight;
} & (AnimatedTextChildProps | AnimatedTextSelectorProps<T>);

export type AnimatedTextChildProps = {
  children: SharedOrDerivedValueText | string | null | undefined;
  selector?: undefined;
};

export type AnimatedTextSelectorProps<T extends SharedValue | DerivedValue> = {
  children: T;
  /**
   * A worklet function that selects text from a shared value provided via `children`.
   */
  selector: (sharedValue: T) => string | null | undefined;
};

const typedForwardRef: <T extends SharedValue | DerivedValue>(
  render: (props: AnimatedTextProps<T>, ref: Ref<ElementRef<typeof AnimateableText>>) => ReactNode
) => (props: AnimatedTextProps<T> & RefAttributes<ElementRef<typeof AnimateableText>>) => ReactNode = forwardRef;

export const AnimatedText = typedForwardRef(function AnimatedText<T extends SharedValue | DerivedValue>(
  {
    align,
    children,
    color = 'label',
    ellipsizeMode,
    numberOfLines,
    selectable,
    selector,
    size,
    style,
    tabularNumbers,
    testID,
    uppercase,
    weight,
  }: AnimatedTextProps<T>,
  ref: Ref<ElementRef<typeof AnimateableText>>
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

  const animatedText = useAnimatedProps(() => ({
    text: (selector ? selector(children) : typeof children === 'string' ? children : children?.value) ?? '',
  }));

  return (
    <AnimateableText
      allowFontScaling={false}
      animatedProps={animatedText}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      ref={ref}
      selectable={selectable}
      style={style ? [textStyle, style] : textStyle}
      testID={testID}
    >
      {lineHeightFixNode}
    </AnimateableText>
  );
});
