import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import styled from 'styled-components';
import { usePagerPosition } from '../../navigation/ScrollPositionContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDelayedValueWithLayoutAnimation } from '@rainbow-me/hooks';

const Dim = styled(Animated.View)`
  flex: 1;
  width: 100%;
`;

export default function CameraDimmer({ children, cameraVisible }: any) {
  const scrollPosition = usePagerPosition();

  const dimStyle = useAnimatedStyle(() => {
    return {
      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      opacity: Math.min(Math.max(scrollPosition.value, 1), 2) - 1,
    };
  });

  const delayedCameraVisible = useDelayedValueWithLayoutAnimation(
    cameraVisible
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Dim style={[dimStyle]}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Dim style={{ opacity: delayedCameraVisible ? 1 : 0 }}>{children}</Dim>
    </Dim>
  );
}
