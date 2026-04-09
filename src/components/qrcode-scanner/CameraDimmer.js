import React from 'react';

import Animated from 'react-native-reanimated';

import styled from '@/framework/ui/styled-thing';
import useDelayedValueWithLayoutAnimation from '@/hooks/useDelayedValueWithLayoutAnimation';

const Dim = styled(Animated.View)({
  flex: 1,
  width: '100%',
});

export default function CameraDimmer({ children, cameraVisible }) {
  const delayedCameraVisible = useDelayedValueWithLayoutAnimation(cameraVisible);

  return (
    <Dim>
      <Dim style={{ opacity: delayedCameraVisible ? 1 : 0 }}>{children}</Dim>
    </Dim>
  );
}
