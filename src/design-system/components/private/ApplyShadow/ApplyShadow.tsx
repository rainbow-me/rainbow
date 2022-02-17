import ConditionalWrap from 'conditional-wrap';
import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { useExperimentalFlags } from '../../../context/ExperimentalFlagsContext';
import { AndroidShadow } from './AndroidShadow';
import { AndroidShadow as AndroidShadowV2 } from './AndroidShadow.v2';
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

export const ApplyShadow = React.forwardRef(
  (
    { backgroundColor, children: child, shadows }: ApplyShadowProps,
    ref: React.Ref<any>
  ) => {
    const { androidShadowsV2 } = useExperimentalFlags();

    if (!shadows) return child;

    const [parentStyles, childStyles] = splitPositionStyles(
      StyleSheet.flatten(child.props.style) || {}
    );
    const iosShadows = [...shadows.ios].reverse();
    const androidChildStyles = {
      elevation: (shadows.android.elevation || 0) + 1,
      shadowColor: 'transparent',
    };

    return (
      <View ref={ref} style={parentStyles}>
        {(ios || web) && (
          <IOSShadow
            backgroundColor={backgroundColor}
            shadows={iosShadows}
            style={childStyles}
          />
        )}
        {android && !androidShadowsV2 && (
          <AndroidShadow
            backgroundColor={backgroundColor}
            shadow={shadows.android}
            style={childStyles}
          />
        )}
        <ConditionalWrap
          condition={Boolean(android && androidShadowsV2)}
          wrap={children => (
            <AndroidShadowV2
              backgroundColor={backgroundColor}
              shadows={iosShadows}
            >
              {children}
            </AndroidShadowV2>
          )}
        >
          {React.cloneElement(child, {
            style: [
              { flex: 1 },
              childStyles,
              android && !androidShadowsV2 ? androidChildStyles : undefined,
            ],
          })}
        </ConditionalWrap>
      </View>
    );
  }
);

ApplyShadow.displayName = 'ApplyShadow';
