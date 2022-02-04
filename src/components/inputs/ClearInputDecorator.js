import React, { useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
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

const duration = 100;
const transition = (
  <Transition.Sequence>
    <Transition.Together>
      <Transition.Out
        durationMs={duration * 0.666}
        interpolation="easeIn"
        type="fade"
      />
      <Transition.Out
        durationMs={duration * 0.42}
        interpolation="easeIn"
        type="scale"
      />
    </Transition.Together>
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    <Transition.Together>
      <Transition.In
        durationMs={duration}
        interpolation="easeOut"
        type="fade"
      />
      <Transition.In
        durationMs={duration * 0.5}
        interpolation="easeOut"
        type="scale"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const ClearInputDecorator = ({ inputHeight, isVisible, onPress, testID }) => {
  const transitionRef = useRef();

  useEffect(() => transitionRef.current?.animateNextTransition(), [isVisible]);

  return (
    <Container>
      {isVisible && (
        <Transitioning.View ref={transitionRef} transition={transition}>
          <Button
            as={ButtonPressAnimation}
            onPress={onPress}
            size={inputHeight}
            testID={testID}
          >
            <TextIcon>􀁡</TextIcon>
          </Button>
        </Transitioning.View>
      )}
    </Container>
  );
};

export default magicMemo(ClearInputDecorator, 'isVisible');
