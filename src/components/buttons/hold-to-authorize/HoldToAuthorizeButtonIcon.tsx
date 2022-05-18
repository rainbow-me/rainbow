import React from 'react';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Icon } from '../../icons';
import { Centered } from '../../layout';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const Container = styled(Centered)({
  ...position.sizeAsObject(31),
  left: 15,
  position: 'absolute',
});

interface Props {
  sharedValue: Animated.SharedValue<number>;
}

export default function HoldToAuthorizeButtonIcon({ sharedValue }: Props) {
  const animatedStyle = useAnimatedStyle(() => {
    const scaleProgress =
      sharedValue.value > 0
        ? interpolate(sharedValue.value, [30, 100], [5, 0], Extrapolation.CLAMP)
        : 1 / sharedValue.value;

    const opacity = interpolate(
      scaleProgress,
      [0, 10, 25],
      [1, 0.333, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scaleProgress,
      [0, 33],
      [1, 0.01],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Container>
      <Animated.View
        {...position.centeredAsObject}
        style={[position.coverAsObject, animatedStyle]}
      >
        <Icon name="progress" progress={sharedValue} />
      </Animated.View>
    </Container>
  );
}
