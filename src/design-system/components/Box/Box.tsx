import { mapValues } from 'lodash';
import React, { ComponentProps, ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import { BackgroundColor } from '../../color/palettes';
import { negativeSpace, NegativeSpace, space, Space } from '../../layout/space';
import { Background } from '../Background/Background';

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

export interface BoxProps extends ComponentProps<typeof View> {
  background?: BackgroundColor;
  flexDirection?: 'row' | 'column';
  flexWrap?: 'wrap';
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;
  flexBasis?: 0;
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between';
  paddingTop?: Space;
  paddingBottom?: Space;
  paddingLeft?: Space;
  paddingRight?: Space;
  paddingVertical?: Space;
  paddingHorizontal?: Space;
  padding?: Space;
  marginTop?: NegativeSpace;
  marginBottom?: NegativeSpace;
  marginLeft?: NegativeSpace;
  marginRight?: NegativeSpace;
  marginVertical?: NegativeSpace;
  marginHorizontal?: NegativeSpace;
  margin?: NegativeSpace;
  width?: keyof typeof widths;
  children?: ReactNode;
}

export function Box({
  background,
  flexDirection,
  flexWrap,
  flexGrow,
  flexShrink,
  flexBasis,
  alignItems,
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
  style: styleProp,
  children,
  ...restProps
}: BoxProps) {
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
    return [styles, styleProp];
  }, [styles, styleProp]);

  return background && children ? (
    <Background color={background}>
      {({ style: backgroundStyle }) => (
        <View style={[backgroundStyle, style]} {...restProps}>
          {children}
        </View>
      )}
    </Background>
  ) : (
    <View style={style} {...restProps}>
      {children}
    </View>
  );
}
