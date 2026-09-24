import React from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { AndroidShadow } from './AndroidShadow';
import { IOSShadow } from './IOSShadow';

export type AndroidShadowItem = {
  elevation: ViewStyle['elevation'];
  opacity: ViewStyle['opacity'];
  color: ViewStyle['shadowColor'];
};
export type ShadowItem = {
  color: ViewStyle['shadowColor'];
  offset: ViewStyle['shadowOffset'];
  opacity: ViewStyle['shadowOpacity'];
  radius: ViewStyle['shadowRadius'];
};
export type Shadows = {
  ios: ShadowItem[];
  android: AndroidShadowItem;
};

export type ApplyShadowProps = {
  backgroundColor: ViewStyle['backgroundColor'];
  children: React.ReactElement<ViewProps>;
  shadows?: Shadows;
};

function splitPositionStyles(style: ViewStyle): [ViewStyle, ViewStyle] {
  const {
    bottom,
    direction,
    display,
    end,
    left,
    margin,
    marginBottom,
    marginEnd,
    marginHorizontal,
    marginLeft,
    marginRight,
    marginStart,
    marginTop,
    marginVertical,
    position,
    right,
    start,
    top,
    zIndex,
    backfaceVisibility,
    opacity,
    transform,
    width,
    height,
    ...rest
  } = style;
  return [
    {
      backfaceVisibility,
      bottom,
      direction,
      display,
      end,
      height,
      left,
      margin,
      marginBottom,
      marginEnd,
      marginHorizontal,
      marginLeft,
      marginRight,
      marginStart,
      marginTop,
      marginVertical,
      opacity,
      position,
      right,
      start,
      top,
      transform,
      width,
      zIndex,
    },
    rest,
  ];
}

function fillDimension(dimension: ViewStyle['width']): ViewStyle['width'] {
  return dimension === undefined || dimension === 'auto' ? undefined : '100%';
}

export const ApplyShadow = ({ backgroundColor, children: child, shadows }: ApplyShadowProps) => {
  if (!shadows) return child;

  const [parentStyles, childStyles] = splitPositionStyles(StyleSheet.flatten(child.props.style) || {});
  const iosShadows = [...shadows.ios].reverse();
  const androidChildStyles = {
    elevation: (shadows.android.elevation || 0) + 1,
    shadowColor: 'transparent',
  };
  const childSizeStyles = {
    height: fillDimension(parentStyles.height),
    width: fillDimension(parentStyles.width),
  };

  return (
    <View style={parentStyles}>
      {(Platform.OS === 'ios' || web) && (
        <IOSShadow backgroundColor={backgroundColor} shadows={iosShadows} style={[childStyles, { overflow: 'visible' }]} />
      )}
      {Platform.OS === 'android' && (
        <AndroidShadow backgroundColor={backgroundColor} shadow={shadows.android} style={[childStyles, { overflow: 'visible' }]} />
      )}

      {React.cloneElement(child, {
        style: [childSizeStyles, childStyles, Platform.OS === 'android' ? androidChildStyles : undefined],
      })}
    </View>
  );
};

ApplyShadow.displayName = 'ApplyShadow';
