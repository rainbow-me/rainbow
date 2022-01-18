import { flatten } from 'lodash';
import React, { forwardRef, ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import {
  useForegroundColor,
  useForegroundColors,
} from '../../color/useForegroundColor';
import {
  defaultShadowColor,
  Shadow,
  ShadowColor,
  shadows,
} from '../../layout/shadow';
import { NegativeSpace, negativeSpace, Space, space } from '../../layout/space';
import {
  BackgroundProvider,
  BackgroundProviderProps,
} from '../BackgroundProvider/BackgroundProvider';
import { ApplyShadow } from '../private/ApplyShadow/ApplyShadow';
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

function resolveToken<TokenName extends string, TokenValue, CustomValue>(
  scale: Record<TokenName, TokenValue>,
  value: TokenName | { custom: CustomValue } | undefined
) {
  return value
    ? typeof value === 'object'
      ? value.custom
      : scale[value]
    : undefined;
}

export type BoxProps = {
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  children?: ReactNode;
  flexBasis?: 0;
  flexDirection?: 'row' | 'row-reverse' | 'column';
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;
  flexWrap?: 'wrap';
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around';
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
} & (
  | {
      borderBottomRadius?: number;
      borderLeftRadius?: never;
      borderRightRadius?: never;
      borderTopRadius?: number;
    }
  | {
      borderBottomRadius?: never;
      borderLeftRadius?: number;
      borderRightRadius?: number;
      borderTopRadius?: never;
    }
) &
  (
    | {
        background?: BackgroundProviderProps['color'];
        shadow?: never;
      }
    | {
        background: BackgroundProviderProps['color'];
        shadow: Shadow;
      }
  );

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
    borderBottomRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderLeftRadius,
    borderRadius,
    borderRightRadius,
    borderTopLeftRadius,
    borderTopRadius,
    borderTopRightRadius,
    children,
    flexBasis,
    flexDirection,
    flexGrow,
    flexShrink,
    flexWrap,
    justifyContent,
    margin: marginProp,
    marginBottom: marginBottomProp,
    marginHorizontal: marginHorizontalProp,
    marginLeft: marginLeftProp,
    marginRight: marginRightProp,
    marginTop: marginTopProp,
    marginVertical: marginVerticalProp,
    padding: paddingProp,
    paddingBottom: paddingBottomProp,
    paddingHorizontal: paddingHorizontalProp,
    paddingLeft: paddingLeftProp,
    paddingRight: paddingRightProp,
    paddingTop: paddingTopProp,
    paddingVertical: paddingVerticalProp,
    shadow,
    style: styleProp,
    width,
    ...restProps
  },
  ref
) {
  const margin = resolveToken(negativeSpace, marginProp);
  const marginBottom = resolveToken(negativeSpace, marginBottomProp);
  const marginHorizontal = resolveToken(negativeSpace, marginHorizontalProp);
  const marginLeft = resolveToken(negativeSpace, marginLeftProp);
  const marginRight = resolveToken(negativeSpace, marginRightProp);
  const marginTop = resolveToken(negativeSpace, marginTopProp);
  const marginVertical = resolveToken(negativeSpace, marginVerticalProp);

  const padding = resolveToken(space, paddingProp);
  const paddingBottom = resolveToken(space, paddingBottomProp);
  const paddingHorizontal = resolveToken(space, paddingHorizontalProp);
  const paddingLeft = resolveToken(space, paddingLeftProp);
  const paddingRight = resolveToken(space, paddingRightProp);
  const paddingTop = resolveToken(space, paddingTopProp);
  const paddingVertical = resolveToken(space, paddingVerticalProp);

  const shadows = useShadow(shadow);

  const styles = useMemo(() => {
    return {
      alignItems,
      borderBottomLeftRadius:
        borderBottomLeftRadius ??
        borderBottomRadius ??
        borderLeftRadius ??
        borderRadius,
      borderBottomRightRadius:
        borderBottomRightRadius ??
        borderBottomRadius ??
        borderRightRadius ??
        borderRadius,
      borderTopLeftRadius:
        borderTopLeftRadius ??
        borderTopRadius ??
        borderLeftRadius ??
        borderRadius,
      borderTopRightRadius:
        borderTopRightRadius ??
        borderTopRadius ??
        borderRightRadius ??
        borderRadius,
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
      width: width ? widths[width] : undefined,
    };
  }, [
    alignItems,
    borderBottomRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderLeftRadius,
    borderRadius,
    borderRightRadius,
    borderTopLeftRadius,
    borderTopRadius,
    borderTopRightRadius,
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
    <BackgroundProvider color={background} style={style}>
      {({ backgroundColor, backgroundStyle }) => (
        <ApplyShadow backgroundColor={backgroundColor} shadows={shadows}>
          <Component style={backgroundStyle} {...restProps} ref={ref}>
            {children}
          </Component>
        </ApplyShadow>
      )}
    </BackgroundProvider>
  ) : (
    <Component style={style} {...restProps} ref={ref}>
      {children}
    </Component>
  );
}) as PolymorphicBox;

function useShadow(shadowProp: BoxProps['shadow']) {
  const shadow = resolveToken(shadows, shadowProp);

  const iosColors = useMemo(() => {
    if (shadow) {
      return shadow.ios.map(({ color }) => color || defaultShadowColor);
    }
    return [defaultShadowColor as ShadowColor];
  }, [shadow]);
  const iosShadowColors = useForegroundColors(iosColors);

  const androidColor = useForegroundColor(
    shadow?.android.color || defaultShadowColor
  );

  return useMemo(
    () =>
      shadow
        ? {
            android: {
              ...shadow.android,
              color: androidColor,
            },
            ios: shadow.ios.map((item, index) => {
              const { offset, blur, opacity } = item;
              return {
                color: iosShadowColors[index],
                offset: {
                  height: offset.y,
                  width: offset.x,
                },
                opacity,
                radius: blur,
              };
            }),
          }
        : undefined,
    [androidColor, iosShadowColors, shadow]
  );
}
