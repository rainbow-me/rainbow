import React, { useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { colors, position } from '@rainbow-me/styles';

const Button = styled(Centered).attrs({
  scaleTo: 0.8,
})`
  ${({ size }) => position.size(size)};
`;

const Container = styled.View`
  bottom: 0;
  flex: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const TextIcon = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  letterSpacing: 'zero',
  size: 'large',
  weight: 'bold',
})``;

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

const ClearInputDecorator = ({ inputHeight, isVisible, onPress }) => {
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
          >
            <TextIcon>􀁡</TextIcon>
          </Button>
        </Transitioning.View>
      )}
    </Container>
  );
};

export default magicMemo(ClearInputDecorator, 'isVisible');
