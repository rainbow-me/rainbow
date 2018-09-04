import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import { Animated, TextInput, View } from 'react-native';

import { colors, fonts } from '../../styles';

const Container = styled(View)`
  flex-grow: 1;
`;

const Field = styled(TextInput)`
  color: ${colors.blueGreyDark};
  flex-grow: 1;
  font-family: ${fonts.family.SFMono};
  font-size: ${fonts.size.h2};
  margin-bottom: 10px;
`;

const Underline = styled(View)`
  width: 100%;
  height: 2px;
  background-color: ${colors.blueGreyDark};
  opacity: 0.2;
`;

const UnderlineAnimated = styled(Animated.View)`
  width: 0%;
  height: 2px;
  background-color: ${colors.sendScreen.brightBlue};
  margin-top: -2px;
`;

export default class UnderlineField extends Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
    keyboardType: PropTypes.oneOf(['default', 'number-pad', 'decimal-pad', 'numeric', 'email-address', 'phone-pad']),
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    placeholder: PropTypes.string,
    style: PropTypes.any,
    value: PropTypes.string,
  };

  static defaultProps = {
    onBlur() {},
    onChange() {},
    onFocus() {},
  };

  state = {
    underlineAnimation: new Animated.Value(0),
  };

  onBlur = (...props) => {
    const { onBlur } = this.props;
    const { underlineAnimation } = this.state;

    Animated.timing(underlineAnimation, { toValue: 0, duration: 300 }).start();

    onBlur(...props);
  };

  onFocus = (...props) => {
    const { onFocus } = this.props;
    const { underlineAnimation } = this.state;

    Animated.timing(underlineAnimation, { toValue: 1, duration: 300 }).start();

    onFocus(...props);
  };

  render() {
    const {
      autoFocus,
      keyboardType,
      onChange,
      placeholder,
      style,
      value,
    } = this.props;

    const {
      underlineAnimation,
    } = this.state;

    return (
      <Container style={style}>
        <Field
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          onBlur={this.onBlur}
          onChange={onChange}
          onFocus={this.onFocus}
          placeholder={placeholder}
          value={value}
        />
        <Underline />
        <UnderlineAnimated style={{ width: underlineAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </Container>
    );
  }
}
