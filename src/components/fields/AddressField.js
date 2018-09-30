import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import { Animated, TextInput } from 'react-native';

import { abbreviations } from '../../utils';
import { colors, fonts } from '../../styles';

const Container = styled(TextInput)`
  flex-grow: 1;
  font-size: ${fonts.size.h5}
  font-family: ${fonts.family.SFMono};
  font-weight: ${fonts.weight.semibold};
  color: ${props => (props.isValid ? colors.sendScreen.brightBlue : colors.blueGreyDark)};
  margin-top: 1px;
`;

export default class UnderlineField extends Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
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

  render() {
    const { autoFocus, isValid, style } = this.props;
    const { value } = this.state;

    return (
      <Container
        autoFocus={autoFocus}
        isValid={isValid}
        onChange={this.onChange}
        placeholder="Ethereum Address: (0x...)"
        value={isValid ? abbreviations.address(value) : value}
        style={style}
      />
    );
  }
}
