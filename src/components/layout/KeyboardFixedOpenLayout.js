import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { withKeyboardHeight } from '../../hoc';
import { padding, position } from '../../styles';
import { deviceUtils, safeAreaInsetValues } from '../../utils';
import Centered from './Centered';
import { setKeyboardHeight as storeKeyboardHeight } from '../../handlers/localstorage/globalSettings';
import { calculateKeyboardHeight } from '../../helpers/keyboardHeight';

const deviceHeight = deviceUtils.dimensions.height;

const FallbackKeyboardHeight = calculateKeyboardHeight(deviceHeight);

const containerStyle = {
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
};

const InnerWrapper = styled(Centered)`
  ${padding(safeAreaInsetValues.top, 0, 10)};
  ${position.size('100%')};
`;

const transition = (
  <Transition.Change durationMs={150} interpolation="easeOut" />
);

const KeyboardFixedOpenLayout = ({
  keyboardHeight,
  setKeyboardHeight,
  ...props
}) => {
  const ref = useRef();
  const [didMeasure, setDidMeasure] = useState(false);
  const resolvedKeyboardHeight = keyboardHeight || FallbackKeyboardHeight;

  const handleKeyboardWillShow = useCallback(
    async ({ endCoordinates: { height } }) => {
      if (height !== keyboardHeight) {
        const newHeight = Math.floor(height);
        setDidMeasure(true);
        storeKeyboardHeight(newHeight);
        setKeyboardHeight(newHeight);
      }
    },
    [keyboardHeight, setDidMeasure, setKeyboardHeight]
  );

  useEffect(() => {
    let listener = undefined;

    if (!didMeasure) {
      listener = Keyboard.addListener(
        'keyboardWillShow',
        handleKeyboardWillShow
      );
    }

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [didMeasure, handleKeyboardWillShow]);

  return (
    <Transitioning.View
      ref={ref}
      height={deviceHeight - resolvedKeyboardHeight}
      style={containerStyle}
      transition={transition}
    >
      <KeyboardAvoidingView behavior="height" enabled={!keyboardHeight}>
        <InnerWrapper {...props} />
      </KeyboardAvoidingView>
    </Transitioning.View>
  );
};

KeyboardFixedOpenLayout.propTypes = {
  keyboardHeight: PropTypes.number,
  setKeyboardHeight: PropTypes.func,
};

export default withKeyboardHeight(KeyboardFixedOpenLayout);
