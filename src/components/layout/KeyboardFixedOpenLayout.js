import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useDimensions, useKeyboardHeight } from '../../hooks';
import { position } from '../../styles';
import { safeAreaInsetValues } from '../../utils';
import Centered from './Centered';

const sx = StyleSheet.create({
  container: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  innerWrapper: {
    ...position.sizeAsObject('100%'),
    paddingBottom: 10,
    paddingTop: safeAreaInsetValues.top,
  },
});

const transition = (
  <Transition.Change durationMs={150} interpolation="easeOut" />
);

const KeyboardFixedOpenLayout = ({ additionalPadding, ...props }) => {
  const { height: screenHeight } = useDimensions();
  const { keyboardHeight } = useKeyboardHeight();
  const transitionRef = useRef();

  const containerHeight = screenHeight - keyboardHeight - additionalPadding;
  useEffect(() => {
    transitionRef.current.animateNextTransition();
  }, [containerHeight]);

  return (
    <Transitioning.View
      height={containerHeight}
      ref={transitionRef}
      style={sx.container}
      transition={transition}
    >
      <KeyboardAvoidingView behavior="height" enabled={!keyboardHeight}>
        <Centered {...props} style={sx.innerWrapper} />
      </KeyboardAvoidingView>
    </Transitioning.View>
  );
};

KeyboardFixedOpenLayout.propTypes = {
  additionalPadding: PropTypes.number,
};

KeyboardFixedOpenLayout.defaultProps = {
  additionalPadding: 0,
};

export default React.memo(KeyboardFixedOpenLayout);
