import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import { Animated, TextInput, View } from 'react-native';

import { colors, fonts, padding } from '../../styles';
import { Button } from '../buttons';
import { Row } from '../layout';

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

const FieldButton = styled(Button)`
  ${padding(0, 10)}
  background-color: ${colors.sendScreen.brightBlue};
  align-items: center;
  justify-content: center;
  height: 30px;
  margin-top: 4px;
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
    buttonText: PropTypes.string,
    keyboardType: PropTypes.oneOf(['default', 'number-pad', 'decimal-pad', 'numeric', 'email-address', 'phone-pad']),
    format: PropTypes.func,
    maxLength: PropTypes.number,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onPressButton: PropTypes.func,
    placeholder: PropTypes.string,
    style: PropTypes.any,
    value: PropTypes.any,
  };

  static defaultProps = {
    format() {},
    onBlur() {},
    onChange() {},
    onFocus() {},
    onPressButton() {},
  };

  constructor(props) {
    super(props);

    this.state = {
      underlineAnimation: new Animated.Value(0),
      value: props.value,
    };
  }

  componentDidUpdate(prevProps) {
    const { value } = this.props;

    if (value !== prevProps.value) {
      this.setState({ value });
    }
  }

  onBlur = (...props) => {
    const { onBlur } = this.props;
    const { underlineAnimation } = this.state;

    Animated.timing(underlineAnimation, { toValue: 0, duration: 300 }).start();

    onBlur(...props);
  };

  onChange = ({ nativeEvent }) => {
    const { format, onChange } = this.props;
    const value = format(nativeEvent.text);

    this.setState({ value }, () => {
      onChange(value);
    });
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
      buttonText,
      keyboardType,
      maxLength,
      onPressButton,
      placeholder,
      style,
    } = this.props;

    const {
      underlineAnimation,
      value,
    } = this.state;

    return (
      <Container style={style}>
        <Row>
          <Field
            autoFocus={autoFocus}
            keyboardType={keyboardType}
            maxLength={maxLength}
            onBlur={this.onBlur}
            onChange={this.onChange}
            onFocus={this.onFocus}
            placeholder={placeholder}
            value={String(value || '')}
          />
          {buttonText && <FieldButton onPress={onPressButton}>{buttonText}</FieldButton>}
        </Row>
        <Underline />
        <UnderlineAnimated style={{ width: underlineAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </Container>
    );
  }
}
