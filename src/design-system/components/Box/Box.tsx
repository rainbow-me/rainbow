import { mapValues } from 'lodash';
import React, { ComponentProps, ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import { negativeSpace, NegativeSpace, space, Space } from '../../layout/space';

export interface BoxProps extends ComponentProps<typeof View> {
  flexDirection?: 'row' | 'column';
  flexWrap?: 'wrap';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  justifyContent?: 'flex-start' | 'flex-end' | 'center';
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
  width?: 'full';
  children?: ReactNode;
}

export const Box = ({
  flexDirection,
  flexWrap,
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
}: BoxProps) => {
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
      flexDirection,
      flexWrap,
      justifyContent,
      width: width === 'full' ? '100%' : undefined,
      ...paddingValues,
      ...marginValues,
    };
  }, [
    flexDirection,
    flexWrap,
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
  ]);

  const style = useMemo(() => {
    return [styles, styleProp];
  }, [styles, styleProp]);

  return (
    <View style={style} {...restProps}>
      {children}
    </View>
  );
};
