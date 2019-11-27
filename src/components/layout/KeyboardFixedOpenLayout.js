import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import { withKeyboardHeight } from '../../hoc';
import { padding, position } from '../../styles';
import { deviceUtils, safeAreaInsetValues } from '../../utils';
import Centered from './Centered';
import { setKeyboardHeight } from '../../handlers/localstorage/globalSettings';
import { calculateKeyboardHeight } from '../../helpers/keyboardHeight';

const FallbackKeyboardHeight = calculateKeyboardHeight(
  deviceUtils.dimensions.height
);

const Container = styled.View`
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const InnerWrapper = styled(Centered)`
  ${padding(safeAreaInsetValues.top, 0, 10)};
  ${position.size('100%')};
`;

class KeyboardFixedOpenLayout extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    keyboardHeight: PropTypes.number,
    setKeyboardHeight: PropTypes.func,
  };

  componentDidMount = () => {
    this.willShowListener = Keyboard.addListener(
      'keyboardWillShow',
      this.keyboardWillShow
    );
  };

  componentWillUnmount = () => this.clearKeyboardListeners();

  willShowListener = undefined;

  clearKeyboardListeners = () => {
    if (this.willShowListener) {
      // console.log('this.willShowListener', this.willShowListener);

      this.willShowListener.remove();
    }
  };

  keyboardWillShow = async ({ endCoordinates: { height } }) => {
    if (height !== this.props.keyboardHeight) {
      const keyboardHeight = Math.floor(height);
      setKeyboardHeight(keyboardHeight);
      this.props.setKeyboardHeight(keyboardHeight);
    }
    this.clearKeyboardListeners();
  };

  render = () => {
    const { keyboardHeight } = this.props;

    const resolvedKeyboardHeight = keyboardHeight || FallbackKeyboardHeight;
    const containerHeight =
      deviceUtils.dimensions.height - resolvedKeyboardHeight;

    return (
      <Container height={containerHeight}>
        <KeyboardAvoidingView behavior="height" enabled={!keyboardHeight}>
          <InnerWrapper {...this.props} />
        </KeyboardAvoidingView>
      </Container>
    );
  };
}

export default compose(
  withKeyboardHeight
  // onlyUpdateForKeys(['height']),
)(KeyboardFixedOpenLayout);
