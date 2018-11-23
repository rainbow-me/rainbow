import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import { Animated, Text, TextInput, View } from 'react-native';

import { abbreviations } from '../../utils';
import { colors, fonts } from '../../styles';
import { Row } from '../layout';

const Container = styled(View)`
  position: relative;
  flex-grow: 1;
`;

const Input = styled(TextInput)`
  flex-grow: 1;
  font-size: ${fonts.size.h5}
  font-family: ${fonts.family.SFMono};
  font-weight: ${fonts.weight.semibold};
  color: ${props => (props.isValid ? colors.sendScreen.brightBlue : colors.blueGreyDark)};
  margin-top: 1px;
  z-index: 1;
`;

const Placeholder = styled(Row)`
  position: absolute;
  top: 0;
  z-index: 0;
`;

const SFMono = styled(Text)`
  color: ${colors.blueGreyDark};
  font-family: ${fonts.family.SFMono};
  font-size: ${fonts.size.h5};
  font-weight: ${fonts.weight.semibold};
  opacity: 0.6;
`;

const SFProText = styled(Text)`
  color: ${colors.blueGreyDark};
  font-family: ${fonts.family.SFProText};
  font-size: ${fonts.size.h5};
  font-weight: ${fonts.weight.semibold};
  opacity: 0.6;
`;

export default class UnderlineField extends Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
    inputRef: PropTypes.func,
    isValid: PropTypes.bool,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    style: PropTypes.any,
    value: PropTypes.any,
  };

  static defaultProps = {
    isValid: false,
    onBlur() {},
    onChange() {},
    onFocus() {},
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

  onChange = ({ nativeEvent }) => {
    const { isValid, onChange } = this.props;
    const { value } = this.state;

    let addressValue = nativeEvent.text;

    if (isValid) {
      if (addressValue.length > abbreviations.address(value).length) {
        addressValue = value + addressValue.substring(addressValue.length - 1);
      } else if (addressValue.length < abbreviations.address(value).length) {
        addressValue = value.substring(0, value.length - 1);
      }
    }

    this.setState({ value: addressValue }, () => {
      onChange(addressValue);
    });
  };

  renderPlaceholder() {
    return (
      <Placeholder>
        <SFProText>Ethereum Address (</SFProText>
        <SFMono>0x</SFMono>
        <SFProText>...)</SFProText>
      </Placeholder>
    );
  }

  render() {
    const {
      autoFocus,
      inputRef,
      isValid,
      style,
    } = this.props;

    const {
      value,
    } = this.state;

    return (
      <Container>
        <Input
          autoFocus={autoFocus}
          autoCorrect={false}
          isValid={isValid}
          keyboardType="name-phone-pad"
          onChange={this.onChange}
          value={isValid ? abbreviations.address(value) : value}
          style={style}
          innerRef={inputRef}
        />
        {!value ? this.renderPlaceholder() : null}
      </Container>
    );
  }
}
