import React from 'react';
import Animated from 'react-native-reanimated';

export default function JellySelectorColorIndicator({
  backgroundColor,
  height,
  translateX,
  width,
  ...props
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View
      {...props}
      borderRadius={height / 2}
      height={height}
      style={{
        backgroundColor,
        transform: [{ translateX }],
        width,
      }}
    />
  );
}
