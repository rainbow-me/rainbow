import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

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

function splitPositionStyles(style: ViewStyle) {
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

export const ApplyShadow = React.forwardRef(({ backgroundColor, children: child, shadows }: ApplyShadowProps, ref: React.Ref<any>) => {
  if (!shadows) return child;

  const [parentStyles, childStyles] = splitPositionStyles(StyleSheet.flatten(child.props.style) || {});
  const iosShadows = [...shadows.ios].reverse();
  const androidChildStyles = {
    elevation: (shadows.android.elevation || 0) + 1,
    shadowColor: 'transparent',
  };

  return (
    <View ref={ref} style={parentStyles}>
      {(ios || web) && <IOSShadow backgroundColor={backgroundColor} shadows={iosShadows} style={childStyles} />}
      {android && <AndroidShadow backgroundColor={backgroundColor} shadow={shadows.android} style={childStyles} />}

      {React.cloneElement(child, {
        style: [{ flex: 1 }, childStyles, android ? androidChildStyles : undefined],
      })}
    </View>
  );
});

ApplyShadow.displayName = 'ApplyShadow';
