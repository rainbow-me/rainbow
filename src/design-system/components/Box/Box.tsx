import React, { forwardRef, ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import {
  useForegroundColor,
  useForegroundColors,
} from '../../color/useForegroundColor';
import { useColorMode } from '../../color/ColorMode';
import { Height, heights, Width, widths } from '../../layout/size';
import { Shadow, shadows } from '../../layout/shadow';
import {
  BackgroundProvider,
  BackgroundProviderProps,
} from '../BackgroundProvider/BackgroundProvider';
import { ApplyShadow } from '../private/ApplyShadow/ApplyShadow';
import type * as Polymorphic from './polymorphic';

export function resolveToken<TokenName extends string, TokenValue, CustomValue>(
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
  bottom?: number;
  children?: ReactNode;
  flexBasis?: 0;
  flexDirection?: 'row' | 'row-reverse' | 'column';
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;
  flexWrap?: 'wrap';
  height?: Height | number;
  left?: number;
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around';
  margin?: number;
  marginBottom?: number;
  marginHorizontal?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginVertical?: number;
  padding?: number;
  paddingBottom?: number;
  paddingHorizontal?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingVertical?: number;
  position?: number;
  right?: number;
  top?: number;
  width?: Width | number;
  overflow?: 'hidden' | 'visible' | 'scroll';
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
    borderBottomLeftRadius,
    borderBottomRadius,
    borderBottomRightRadius,
    borderLeftRadius,
    borderRadius,
    borderRightRadius,
    borderTopLeftRadius,
    borderTopRadius,
    borderTopRightRadius,
    bottom,
    children,
    flexBasis,
    flexDirection,
    flexGrow,
    flexShrink,
    flexWrap,
    height: heightProp,
    justifyContent,
    left,
    margin,
    marginBottom,
    marginHorizontal,
    marginLeft,
    marginRight,
    marginTop,
    marginVertical,
    overflow,
    padding,
    paddingBottom,
    paddingHorizontal,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingVertical,
    position,
    right,
    shadow,
    style: styleProp,
    top,
    width: widthProp,
    ...restProps
  },
  ref
) {
  const width =
    typeof widthProp === 'number' ? widthProp : resolveToken(widths, widthProp);
  const height =
    typeof heightProp === 'number'
      ? heightProp
      : resolveToken(heights, heightProp);

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
      bottom,
      flexBasis,
      flexDirection,
      flexGrow,
      flexShrink,
      flexWrap,
      height,
      justifyContent,
      left,
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
      position,
      right,
      top,
      width,
    };
  }, [
    alignItems,
    borderBottomLeftRadius,
    borderBottomRadius,
    borderBottomRightRadius,
    borderLeftRadius,
    borderRadius,
    borderRightRadius,
    borderTopLeftRadius,
    borderTopRadius,
    borderTopRightRadius,
    bottom,
    flexBasis,
    flexDirection,
    flexGrow,
    flexShrink,
    flexWrap,
    height,
    justifyContent,
    left,
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
    position,
    right,
    top,
    width,
  ]);

  const style = useMemo(() => {
    const stylesArray = [styles, styleProp];

    // We flatten the styles array in case it's passed to Animated.View.
    // This won't be needed with v2.3+ of react-native-reanimated.
    return Component === View ? stylesArray : stylesArray.flat();
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

function useShadowColorMode() {
  const { colorMode } = useColorMode();

  if (colorMode === 'darkTinted') {
    return 'dark';
  }

  if (colorMode === 'lightTinted') {
    return 'light';
  }

  return colorMode;
}

function useShadow(shadowProp: BoxProps['shadow']) {
  const shadowColorMode = useShadowColorMode();
  const shadowToken = resolveToken(shadows, shadowProp);
  const shadow =
    shadowToken && 'light' in shadowToken
      ? shadowToken[shadowColorMode]
      : shadowToken;

  const iosColors = useMemo(() => {
    return shadow ? shadow.ios.map(({ color }) => color) : [];
  }, [shadow]);
  const iosShadowColors = useForegroundColors(iosColors);

  const androidColor = useForegroundColor(
    shadow ? shadow.android.color : 'shadowFar' // This fallback color will never be used if shadow is undefined, but we're using a sensible default anyway just in case
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
              const { x, y, blur, opacity } = item;

              return {
                color: iosShadowColors[index],
                offset: { width: x, height: y },
                opacity,
                radius: blur,
              };
            }),
          }
        : undefined,
    [androidColor, iosShadowColors, shadow]
  );
}
