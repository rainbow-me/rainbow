import React from 'react';
import { StyleSheet } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ShadowView' was resolved to '/Users/nick... Remove this comment to see the full error message
import ShadowView from './ShadowView';

const buildShadow = (
  width = 0,
  height = 0,
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'radius' implicitly has an 'any' type.
  radius,
  shadowColor = '#000000',
  shadowOpacity = 0.4
) => ({
  shadowColor,

  shadowOffset: {
    height,
    width,
  },

  shadowOpacity,
  shadowRadius: radius / 2,
});

const ShadowItem = ({
  backgroundColor,
  borderRadius,
  height,
  opacity,
  shadow,
  width,
  zIndex,
  shadowProps,
  elevation,
}: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ShadowView
      elevation={elevation}
      shadowProps={shadowProps}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: backgroundColor || '#ffffff',
          borderRadius,
          elevation,
          height,
          opacity,
          width,
          zIndex,
          // @ts-expect-error ts-migrate(2556) FIXME: Expected 3-5 arguments, but got 0 or more.
          ...buildShadow(...shadow),
        },
      ]}
    />
  );
};

export default React.memo(ShadowItem);
