import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';

const Container = styled.View`
  bottom: 0;
  flex: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

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
  const ref = useRef();

  if (ref.current) {
    ref.current.animateNextTransition();
  }

  return (
    <Container>
      {isVisible && (
        <Transitioning.View ref={ref} transition={transition}>
          <ButtonPressAnimation onPress={onPress} scaleTo={0.8}>
            <Centered height={inputHeight} width={inputHeight}>
              <Icon
                color={colors.blueGreyDark}
                name="clearInput"
                opacity={0.3}
              />
            </Centered>
          </ButtonPressAnimation>
        </Transitioning.View>
      )}
    </Container>
  );
};

ClearInputDecorator.propTypes = {
  inputHeight: PropTypes.number,
  isVisible: PropTypes.bool,
  onPress: PropTypes.func,
};

export default React.memo(ClearInputDecorator);
