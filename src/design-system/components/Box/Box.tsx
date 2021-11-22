import { flatten, mapValues } from 'lodash';
import React, { forwardRef, ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import { negativeSpace, NegativeSpace, space, Space } from '../../layout/space';
import {
  BackgroundProvider,
  BackgroundProviderProps,
} from '../BackgroundProvider/BackgroundProvider';
import type * as Polymorphic from './polymorphic';

const fraction = (numerator: number, denominator: number) =>
  `${(numerator * 100) / denominator}%`;

const widths = {
  '1/2': fraction(1, 2),
  '1/3': fraction(1, 3),
  '1/4': fraction(1, 4),
  '1/5': fraction(1, 5),
  '2/3': fraction(2, 3),
  '2/5': fraction(2, 5),
  '3/4': fraction(3, 4),
  '3/5': fraction(3, 5),
  '4/5': fraction(4, 5),
  full: '100%', // eslint-disable-line prettier/prettier
} as const;

export interface BoxProps {
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  background?: BackgroundProviderProps['color'];
  children?: ReactNode;
  flexBasis?: 0;
  flexDirection?: 'row' | 'row-reverse' | 'column';
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;
  flexWrap?: 'wrap';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between';
  margin?: NegativeSpace;
  marginBottom?: NegativeSpace;
  marginHorizontal?: NegativeSpace;
  marginLeft?: NegativeSpace;
  marginRight?: NegativeSpace;
  marginTop?: NegativeSpace;
  marginVertical?: NegativeSpace;
  padding?: Space;
  paddingBottom?: Space;
  paddingHorizontal?: Space;
  paddingLeft?: Space;
  paddingRight?: Space;
  paddingTop?: Space;
  paddingVertical?: Space;
  width?: keyof typeof widths;
}

type PolymorphicBox = Polymorphic.ForwardRefComponent<typeof View, BoxProps>;

/**
 * @description Renders a single `View` element with standard styling. Any
 * background color set via the `background` prop will be used to automatically
 * set the color mode for nested elements. To render another element instead,
 * you can provide the `as` prop, e.g. `<Box as={Animated.View}>`
 */
export const Box = forwardRef(function Box(
  {
    alignItems,
    as: Component = View,
    background,
    children,
    flexBasis,
    flexDirection,
    flexGrow,
    flexShrink,
    flexWrap,
    justifyContent,
    margin,
    marginBottom,
    marginHorizontal,
    marginLeft,
    marginRight,
    marginTop,
    marginVertical,
    padding,
    paddingBottom,
    paddingHorizontal,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingVertical,
    style: styleProp,
    width,
    ...restProps
  },
  ref
) {
  const styles = useMemo(() => {
    const paddingValues = mapValues(
      {
        padding,
        paddingBottom,
        paddingHorizontal,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingVertical,
      },
      value => value && space[value]
    );

    const marginValues = mapValues(
      {
        margin,
        marginBottom,
        marginHorizontal,
        marginLeft,
        marginRight,
        marginTop,
        marginVertical,
      },
      value => value && negativeSpace[value]
    );

    return {
      alignItems,
      flexBasis,
      flexDirection,
      flexGrow,
      flexShrink,
      flexWrap,
      justifyContent,
      width: width ? widths[width] : undefined,
      ...paddingValues,
      ...marginValues,
    };
  }, [
    alignItems,
    flexBasis,
    flexDirection,
    flexGrow,
    flexShrink,
    flexWrap,
    justifyContent,
    margin,
    marginBottom,
    marginHorizontal,
    marginLeft,
    marginRight,
    marginTop,
    marginVertical,
    padding,
    paddingBottom,
    paddingHorizontal,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingVertical,
    width,
  ]);

  const style = useMemo(() => {
    const stylesArray = [styles, styleProp];

    // We flatten the styles array in case it's passed to Animated.View.
    // This won't be needed with v2.3+ of react-native-reanimated.
    return Component === View ? stylesArray : flatten(stylesArray);
  }, [styles, styleProp, Component]);

  return background ? (
    <BackgroundProvider color={background}>
      {backgroundStyle => (
        <Component style={[backgroundStyle, ...style]} {...restProps} ref={ref}>
          {children}
        </Component>
      )}
    </BackgroundProvider>
  ) : (
    <Component style={style} {...restProps} ref={ref}>
      {children}
    </Component>
  );
}) as PolymorphicBox;
