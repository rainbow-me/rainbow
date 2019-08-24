import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { compose, onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import { withKeyboardHeight } from '../../hoc';
import { colors, padding, position } from '../../styles';
import { deviceUtils, safeAreaInsetValues } from '../../utils';
import { Centered } from '../layout';

const FallbackKeyboardHeight = Math.floor(deviceUtils.dimensions.height * 0.333);

const Container = styled.View`
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const InnerWrapper = styled(Centered)`
  ${padding(safeAreaInsetValues.top, 0, 10)};
  ${position.size('100%')};
  background-color: ${colors.transparent};
`;

class KeyboardFixedOpenLayout extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    keyboardHeight: PropTypes.number,
    setKeyboardHeight: PropTypes.func,
  }

  willShowListener = undefined

  componentDidMount = () => {
    if (!this.props.keyboardHeight) {
      this.willShowListener = Keyboard.addListener('keyboardWillShow', this.keyboardWillShow);
    }
  }

  componentWillUnmount = () => this.clearKeyboardListeners()

  clearKeyboardListeners = () => {
    if (this.willShowListener) {
      console.log('this.willShowListener', this.willShowListener);

      // this.willShowListener.remove();
    }
  }

  keyboardWillShow = async ({ endCoordinates: { height } }) => {
    this.props.setKeyboardHeight(Math.floor(height));
    this.clearKeyboardListeners();
  }

  render = () => {
    const { keyboardHeight } = this.props;

    const resolvedKeyboardHeight = keyboardHeight || FallbackKeyboardHeight;
    const containerHeight = deviceUtils.dimensions.height - resolvedKeyboardHeight;

    return (
      <Container height={containerHeight}>
        <KeyboardAvoidingView
          behavior="height"
          enabled={!keyboardHeight}
        >
          <InnerWrapper {...this.props} />
        </KeyboardAvoidingView>
      </Container>
    );
  }
}

export default compose(
  withKeyboardHeight,
  // onlyUpdateForKeys(['height']),
)(KeyboardFixedOpenLayout);
