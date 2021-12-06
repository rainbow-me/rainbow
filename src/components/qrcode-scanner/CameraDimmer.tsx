import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import styled from 'styled-components';
import { usePagerPosition } from '../../navigation/ScrollPositionContext';
import { useDelayedValueWithLayoutAnimation } from '@rainbow-me/hooks';

const Dim = styled(Animated.View)`
  flex: 1;
  width: 100%;
`;

export default function CameraDimmer({ children, cameraVisible }) {
  const scrollPosition = usePagerPosition();

  const dimStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.min(Math.max(scrollPosition.value, 1), 2) - 1,
    };
  });

  const delayedCameraVisible = useDelayedValueWithLayoutAnimation(
    cameraVisible
  );

  return (
    <Dim style={[dimStyle]}>
      <Dim style={{ opacity: delayedCameraVisible ? 1 : 0 }}>{children}</Dim>
    </Dim>
  );
}
