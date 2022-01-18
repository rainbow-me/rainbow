import ConditionalWrap from 'conditional-wrap';
import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { AndroidShadow } from './AndroidShadow';
import { AndroidShadow as AndroidShadowV2 } from './AndroidShadow.v2';
import { IOSShadow } from './IOSShadow';
import useExperimentalFlag, {
  ANDROID_SHADOWS_V2,
} from '@rainbow-me/config/experimentalHooks';

export type ShadowItem = {
  color: ViewStyle['shadowColor'];
  offset: ViewStyle['shadowOffset'];
  opacity: ViewStyle['shadowOpacity'];
  radius: ViewStyle['shadowRadius'];
};

export type ApplyShadowProps = {
  backgroundColor: ViewStyle['backgroundColor'];
  children: React.ReactElement<ViewProps>;
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
      shadows: shadowsProp,
    }: ApplyShadowProps,
    ref: React.Ref<any>
  ) => {
    const isAndroidV2Shadows = useExperimentalFlag(ANDROID_SHADOWS_V2);

    if (!shadowsProp || shadowsProp.length === 0) return child;

    const shadows = [...shadowsProp].reverse();
    const [parentStyles, childStyles] = splitPositionStyles(
      StyleSheet.flatten(child.props.style) || {}
    );

    const maxElevation = Math.max(...shadows.map(({ radius }) => radius || 0));
    const androidChildStyles = {
      elevation: maxElevation + 1,
      shadowColor: 'transparent',
    };

    return (
      <View ref={ref} style={parentStyles}>
        {(ios || web) && (
          <IOSShadow backgroundColor={backgroundColor} shadows={shadows} />
        )}
        {android && !isAndroidV2Shadows && (
          <AndroidShadow backgroundColor={backgroundColor} shadows={shadows} />
        )}
        <ConditionalWrap
          condition={Boolean(android && isAndroidV2Shadows)}
          wrap={children => (
            <AndroidShadowV2
              backgroundColor={backgroundColor}
              shadows={shadows}
            >
              {children}
            </AndroidShadowV2>
          )}
        >
          {React.cloneElement(child, {
            style: [
              childStyles,
              android && !isAndroidV2Shadows ? androidChildStyles : undefined,
            ],
          })}
        </ConditionalWrap>
      </View>
    );
  }
);

ApplyShadow.displayName = 'ApplyShadow';
