import React, { useContext } from 'react';
import Animated from 'react-native-reanimated';

import ChartContext from '../../helpers/ChartContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../helpers/withReanimatedFallback' was ... Remove this comment to see the full error message
import withReanimatedFallback from '../../helpers/withReanimatedFallback';

function ChartDot({ style, size = 10, ...props }: any) {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'dotStyle' does not exist on type 'null'.
  const { dotStyle } = useContext(ChartContext);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View
      {...props}
      pointerEvents="none"
      style={[
        dotStyle,
        {
          borderRadius: size / 2,
          height: size,
          left: -size / 2,
          position: 'absolute',
          top: -size / 2,
          width: size,
        },
        style,
      ]}
    />
  );
}

export default withReanimatedFallback(ChartDot);
