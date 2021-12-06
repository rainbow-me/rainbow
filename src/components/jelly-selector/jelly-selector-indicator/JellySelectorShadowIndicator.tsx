import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

export default function JellySelectorShadowIndicator({
  height,
  translateX,
  width,
  ...props
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const JellySelectorIndicatorShadow = useMemo(
    () => [
      [0, 0, 9, colors.shadowGrey, 0.1],
      [0, 5, 15, colors.shadowGrey, 0.12],
      [0, 10, 30, colors.shadowGrey, 0.06],
    ],
    [colors.shadowGrey]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <AnimatedShadowStack
      borderRadius={height / 2}
      height={height}
      shadows={JellySelectorIndicatorShadow}
      style={{ transform: [{ translateX }], width }}
      {...props}
    />
  );
}
