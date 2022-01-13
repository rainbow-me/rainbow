import ConditionalWrap from 'conditional-wrap';
import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { AndroidShadow } from './AndroidShadow';
import { IOSShadow } from './IOSShadow';

export type ShadowItem = {
  color: ViewStyle['shadowColor'];
  offset: ViewStyle['shadowOffset'];
  opacity: ViewStyle['shadowOpacity'];
  radius: ViewStyle['shadowRadius'];
};

export type ApplyShadowProps = {
  backgroundColor: ViewStyle['backgroundColor'];
  children: React.ReactElement<ViewProps>;
  enabled?: boolean;
  shadows?: ShadowItem[];
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

export const ApplyShadow = React.forwardRef(
  (
    {
      backgroundColor,
      children: child,
      enabled = true,
      shadows,
    }: ApplyShadowProps,
    ref: React.Ref<any>
  ) => {
    if (!enabled || !shadows) return child;

    const [parentStyles, childStyles] = splitPositionStyles(
      StyleSheet.flatten(child.props.style) || {}
    );
    return (
      <View ref={ref} style={parentStyles}>
        {(ios || web) && (
          <IOSShadow backgroundColor={backgroundColor} shadows={shadows} />
        )}
        <ConditionalWrap
          condition={android}
          wrap={children => (
            <AndroidShadow backgroundColor={backgroundColor} shadows={shadows}>
              {children}
            </AndroidShadow>
          )}
        >
          {React.cloneElement(child, {
            style: [childStyles, { backgroundColor }],
          })}
        </ConditionalWrap>
      </View>
    );
  }
);

ApplyShadow.displayName = 'ApplyShadow';
