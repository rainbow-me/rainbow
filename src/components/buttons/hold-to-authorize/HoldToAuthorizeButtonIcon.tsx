import React from 'react';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  SharedValue,
} from 'react-native-reanimated';
import { Icon } from '../../icons';
import { Centered } from '../../layout';
import styled from '@/styled-thing';
import { position } from '@/styles';

const Container = styled(Centered)({
  ...position.sizeAsObject(31),
  left: 15,
  position: 'absolute',
});

interface Props {
  sharedValue: SharedValue<number>;
}

export default function HoldToAuthorizeButtonIcon({ sharedValue }: Props) {
  const circleFillProgressOverride = useSharedValue<number | null>(null);

  const circleFillProgress = useDerivedValue(() => {
    if (sharedValue.value === 100) {
      circleFillProgressOverride.value = 100;
    } else if (sharedValue.value === 0) {
      circleFillProgressOverride.value = null;
    }

    return circleFillProgressOverride.value !== null ? circleFillProgressOverride.value : sharedValue.value;
  });

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(sharedValue.value, [0, 10, 25], [0, 0.333, 1], Extrapolation.CLAMP);

    const scale = interpolate(sharedValue.value, [30, 100], [0.85, 1], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Container>
      <Animated.View {...position.centeredAsObject} style={[position.coverAsObject, animatedStyle]}>
        <Icon name="progress" progress={circleFillProgress} />
      </Animated.View>
    </Container>
  );
}
