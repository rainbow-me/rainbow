import React from 'react';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const Button = styled(Centered).attrs({
  scaleTo: 0.8,
})(({ size }) => position.sizeAsObject(size));

const Container = styled.View({
  bottom: 0,
  flex: 0,
  position: 'absolute',
  right: 0,
  top: 0,
});

const TextIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'zero',
  size: 'large',
  weight: 'bold',
}))({
  marginBottom: 0.5,
});

const easing = Easing.out(Easing.ease);
const duration = 69;

const ClearInputDecorator = ({ inputHeight, isVisible, onPress, testID }) => {
  const keyframe = new Keyframe({
    0: {
      easing,
      opacity: 0,
      transform: [{ scale: 0.0001 }],
    },
    100: {
      easing,
      opacity: 1,
      transform: [{ scale: 1 }],
    },
  });

  return (
    <Container>
      {isVisible && (
        <Animated.View
          entering={keyframe.duration(duration)}
          exiting={keyframe.duration(duration)}
        >
          <Button
            as={ButtonPressAnimation}
            onPress={onPress}
            size={inputHeight}
            testID={testID}
          >
            <TextIcon>􀁡</TextIcon>
          </Button>
        </Animated.View>
      )}
    </Container>
  );
};

export default magicMemo(ClearInputDecorator, 'isVisible');
