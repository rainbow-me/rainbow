import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ShadowItem' was resolved to '/Users/nick... Remove this comment to see the full error message
import ShadowItem from './ShadowItem';

const ShadowStack = React.forwardRef(
  (
    {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'backgroundColor' does not exist on type ... Remove this comment to see the full error message
      backgroundColor,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'borderRadius' does not exist on type '{ ... Remove this comment to see the full error message
      borderRadius,
      children,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'elevation' does not exist on type '{ chi... Remove this comment to see the full error message
      elevation = 0,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type '{ childr... Remove this comment to see the full error message
      height,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'hideShadow' does not exist on type '{ ch... Remove this comment to see the full error message
      hideShadow,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'overflow' does not exist on type '{ chil... Remove this comment to see the full error message
      overflow = 'hidden',
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'shadows' does not exist on type '{ child... Remove this comment to see the full error message
      shadows,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'style' does not exist on type '{ childre... Remove this comment to see the full error message
      style,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'width' does not exist on type '{ childre... Remove this comment to see the full error message
      width,
      ...props
    },
    ref
  ) => {
    const renderItem = useCallback(
      (shadow, index) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ShadowItem
          backgroundColor={backgroundColor}
          borderRadius={borderRadius}
          elevation={elevation}
          height={height}
          key={`${shadow.join('-')}${index}`}
          opacity={hideShadow ? 0 : 1}
          shadow={shadow}
          width={width}
          zIndex={index + 2}
        />
      ),
      [backgroundColor, borderRadius, elevation, height, hideShadow, width]
    );

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View
        {...props}
        backgroundColor="transparent"
        borderRadius={borderRadius}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        height={ios ? height : height || 0}
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        ref={ref}
        style={style}
        width={width}
        zIndex={1}
      >
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        {ios && shadows?.map(renderItem)}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View
          {...props}
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          borderRadius={borderRadius}
          elevation={shadows.reduce(
            (acc: any, curr: any) => acc + Math.min(6, curr[2]),
            0
          )}
          height={height}
          overflow={overflow}
          style={[StyleSheet.absoluteFill, { backgroundColor }]}
          width={width}
          zIndex={shadows?.length + 2 || 0}
        >
          {children}
        </View>
      </View>
    );
  }
);

ShadowStack.displayName = 'ShadowStack';

export default ShadowStack;
