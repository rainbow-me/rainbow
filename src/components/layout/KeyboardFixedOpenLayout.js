import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import styled from 'styled-components/primitives';
import {
  getUndecoratedKeyboardHeight,
  setUndecoratedKeyboardHeight,
} from '../../handlers/commonStorage'
import { colors, position } from '../../styles';
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
  ${position.size('100%')};
  background-color: ${colors.transparent};
  padding-bottom: 10;
`;

export default class KeyboardFixedOpenLayout extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
  }

  constructor(props) {
    super(props);

    this.willShowListener = undefined;

    this.state = {
      keyboardHeight: 0,
    }
  }

  componentDidMount = async () => {
    const keyboardHeight = await getUndecoratedKeyboardHeight();

    if (keyboardHeight && keyboardHeight !== this.state.keyboardHeight) {
      this.setState({ keyboardHeight });
    }

    if (!keyboardHeight) {
      this.willShowListener = Keyboard.addListener('keyboardWillShow', this.keyboardWillShow);
    }
  }

  componentWillUnmount = () => this.clearKeyboardListeners()

  clearKeyboardListeners = () => {
    if (this.willShowListener) {
      this.willShowListener.remove();
    }
  }

  keyboardWillShow = async ({ endCoordinates: { height } }) => {
    const keyboardHeight = Math.floor(height);
    this.setState({ keyboardHeight });
    return setUndecoratedKeyboardHeight(keyboardHeight).then(this.clearKeyboardListeners);
  }

  render = () => {
    const { keyboardHeight } = this.state;

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

