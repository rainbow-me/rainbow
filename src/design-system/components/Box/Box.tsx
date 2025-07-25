import React, { forwardRef, ReactNode, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useForegroundColor, useForegroundColors } from '../../color/useForegroundColor';
import { useColorMode } from '../../color/ColorMode';
import { Shadow, shadows } from '../../layout/shadow';
import { Height, heights, Width, widths } from '../../layout/size';
import { NegativeSpace, negativeSpace, positionSpace, PositionSpace, Space, space } from '../../layout/space';
import { BackgroundProvider } from '../BackgroundProvider/BackgroundProvider';
import { Border, BorderProps } from '../Border/Border';
import { ApplyShadow } from '../private/ApplyShadow/ApplyShadow';
import type * as Polymorphic from './polymorphic';
import { IS_TEST } from '@/env';
import LinearGradient from 'react-native-linear-gradient';
import { BackgroundColor } from '@/design-system/color/palettes';

const COMPONENTS_TO_OVERRIDE_IN_TEST_MODE = [LinearGradient];

const positions = ['absolute'] as const;
type Position = (typeof positions)[number];

export function resolveToken<TokenName extends string, TokenValue, CustomValue>(
  scale: Record<TokenName, TokenValue>,
  value: TokenName | { custom: CustomValue } | undefined
) {
  return value ? (typeof value === 'object' ? value.custom : scale[value]) : undefined;
}

export type BoxProps = {
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderColor?: BorderProps['borderColor'];
  borderWidth?: BorderProps['borderWidth'];
  bottom?: PositionSpace;
  children?: ReactNode;
  flexBasis?: 0;
  flexDirection?: 'row' | 'row-reverse' | 'column';
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;
  flexWrap?: 'wrap';
  height?: Height | number;
  left?: PositionSpace;
  gap?: number;
  zIndex?: number;
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  margin?: NegativeSpace;
  marginBottom?: NegativeSpace;
  marginHorizontal?: NegativeSpace;
  marginLeft?: NegativeSpace;
  marginRight?: NegativeSpace;
  marginTop?: NegativeSpace;
  marginVertical?: NegativeSpace;
  overflow?: 'visible' | 'hidden' | 'scroll';
  padding?: Space;
  paddingBottom?: Space;
  paddingHorizontal?: Space;
  paddingLeft?: Space;
  paddingRight?: Space;
  paddingTop?: Space;
  paddingVertical?: Space;
  position?: Position;
  right?: PositionSpace;
  top?: PositionSpace;
  width?: Width | number;
  backgroundColor?: string;
  shadowColor?: string;
  elevation?: number;
  shadowOpacity?: number;
  shadowRadius?: number;
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
        background?: BackgroundColor | 'accent';
        shadow?: never;
      }
    | {
        background: BackgroundColor | 'accent';
        shadow: Shadow;
      }
    | {
        background?: never;
        backgroundColor: string;
        shadow: Shadow;
      }
    | {
        background?: never;
        shadow: Shadow;
        style: StyleProp<ViewStyle> & { backgroundColor: string };
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
    backgroundColor,
    borderBottomLeftRadius,
    borderBottomRadius,
    borderBottomRightRadius,
    borderColor,
    borderLeftRadius,
    borderRadius,
    borderRightRadius,
    borderTopLeftRadius,
    borderTopRadius,
    borderTopRightRadius,
    borderWidth,
    bottom: bottomProp,
    children,
    flexBasis,
    flexDirection,
    flexGrow,
    flexShrink,
    flexWrap,
    height: heightProp,
    justifyContent,
    left: leftProp,
    margin: marginProp,
    marginBottom: marginBottomProp,
    marginHorizontal: marginHorizontalProp,
    marginLeft: marginLeftProp,
    marginRight: marginRightProp,
    marginTop: marginTopProp,
    marginVertical: marginVerticalProp,
    overflow,
    padding: paddingProp,
    paddingBottom: paddingBottomProp,
    paddingHorizontal: paddingHorizontalProp,
    paddingLeft: paddingLeftProp,
    paddingRight: paddingRightProp,
    paddingTop: paddingTopProp,
    paddingVertical: paddingVerticalProp,
    position,
    right: rightProp,
    shadow,
    style: styleProp,
    top: topProp,
    width: widthProp,
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

  const bottom = resolveToken(positionSpace, bottomProp);
  const left = resolveToken(positionSpace, leftProp);
  const right = resolveToken(positionSpace, rightProp);
  const top = resolveToken(positionSpace, topProp);

  const width = typeof widthProp === 'number' ? widthProp : resolveToken(widths, widthProp);
  const height = typeof heightProp === 'number' ? heightProp : resolveToken(heights, heightProp);

  const ComponentToUse = IS_TEST && COMPONENTS_TO_OVERRIDE_IN_TEST_MODE.some(_C => Component instanceof _C) ? View : Component;
  const isView = ComponentToUse === View || ComponentToUse === Animated.View;

  const shadowStylesExist =
    !!styleProp &&
    ('shadowColor' in styleProp ||
      'shadowOffset' in styleProp ||
      'shadowOpacity' in styleProp ||
      'shadowRadius' in styleProp ||
      'elevation' in styleProp);

  const shadows = useShadow(shadow);

  const styles = useMemo(() => {
    return {
      alignItems,
      borderRadius: borderRadius, // Apply this first as certain components don't support individual corner radii
      borderBottomLeftRadius: borderBottomLeftRadius ?? borderBottomRadius ?? borderLeftRadius ?? borderRadius,
      borderBottomRightRadius: borderBottomRightRadius ?? borderBottomRadius ?? borderRightRadius ?? borderRadius,
      borderCurve: 'continuous' as ViewStyle['borderCurve'],
      borderTopLeftRadius: borderTopLeftRadius ?? borderTopRadius ?? borderLeftRadius ?? borderRadius,
      borderTopRightRadius: borderTopRightRadius ?? borderTopRadius ?? borderRightRadius ?? borderRadius,
      bottom,
      flexBasis,
      flexDirection,
      flexGrow,
      flexShrink,
      flexWrap,
      height: height as ViewStyle['height'],
      justifyContent,
      left,
      margin,
      marginBottom,
      marginHorizontal,
      marginLeft,
      marginRight,
      marginTop,
      marginVertical,
      ...((isView || borderRadius) && !shadowStylesExist && { overflow: borderRadius ? 'hidden' : overflow }),
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
      width: width as ViewStyle['width'],
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
    isView,
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
    shadowStylesExist,
    top,
    width,
  ]);

  const style = useMemo(() => [styles, styleProp], [styles, styleProp]);

  const styleHasBackgroundColor = !!(styleProp && 'backgroundColor' in styleProp && styleProp.backgroundColor !== 'transparent');
  const backgroundToUse =
    styleHasBackgroundColor && typeof styleProp.backgroundColor === 'string' ? styleProp.backgroundColor : background ?? backgroundColor;

  return backgroundToUse ? (
    <BackgroundProvider color={backgroundToUse} style={style}>
      {({ backgroundColor, backgroundStyle }) => {
        return (
          <ApplyShadow backgroundColor={backgroundColor} shadows={shadows}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <ComponentToUse style={backgroundStyle} {...restProps} ref={ref}>
              {children}
              {borderColor || borderWidth ? (
                <Border
                  borderBottomLeftRadius={styles.borderBottomLeftRadius}
                  borderBottomRightRadius={styles.borderBottomRightRadius}
                  borderColor={borderColor}
                  borderTopLeftRadius={styles.borderTopLeftRadius}
                  borderTopRightRadius={styles.borderTopRightRadius}
                  borderWidth={borderWidth}
                  enableInLightMode
                />
              ) : null}
            </ComponentToUse>
          </ApplyShadow>
        );
      }}
    </BackgroundProvider>
  ) : (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <ComponentToUse style={style} {...restProps} ref={ref}>
      {children}
      {borderColor || borderWidth ? (
        <Border
          borderBottomLeftRadius={styles.borderBottomLeftRadius}
          borderBottomRightRadius={styles.borderBottomRightRadius}
          borderColor={borderColor}
          borderTopLeftRadius={styles.borderTopLeftRadius}
          borderTopRightRadius={styles.borderTopRightRadius}
          borderWidth={borderWidth}
          enableInLightMode
        />
      ) : null}
    </ComponentToUse>
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
  const shadow = shadowToken && 'light' in shadowToken ? shadowToken[shadowColorMode] : shadowToken;

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
