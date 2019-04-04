import { isValidAddress } from '@rainbow-me/rainbow-common';
import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components/primitives';
import { Input } from '../inputs';
import { Row } from '../layout';
import { Label } from '../text';
import { colors } from '../../styles';
import { abbreviations } from '../../utils';

const AddressInput = styled(Input).attrs({ family: 'SFMono' })`
  flex-grow: 1;
  margin-top: 1;
  z-index: 1;
`;

const Placeholder = styled(Row)`
  position: absolute;
  top: 0;
  z-index: 1;
`;

const PlaceholderText = styled(Label)`
  opacity: 0.45;
`;

export default class AddressField extends PureComponent {
  static propTypes = {
    autoFocus: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  state = {
    isValid: false,
    value: '',
  }

  componentDidUpdate() {
    if (this.props.value && !this.state.value) {
      this.setState({
        isValid: true,
        value: abbreviations.address(this.props.value),
      });
    }
  }

  onChange = ({ nativeEvent }) => this.props.onChange(nativeEvent.text)

  onChangeText = (inputValue) => {
    const isValid = isValidAddress(inputValue);
    this.setState({
      isValid,
      value: isValid ? abbreviations.address(inputValue) : inputValue,
    });
  }

  render() {
    const { autoFocus, ...props } = this.props;
    const { isValid, value } = this.state;

    return (
      <Row flex={1}>
        <AddressInput
          {...props}
          {...omit(Label.textProps, 'opacity')}
          autoCorrect={false}
          autoFocus={autoFocus}
          color={isValid ? colors.appleBlue : colors.blueGreyDark}
          keyboardType="name-phone-pad"
          maxLength={42}
          onChange={this.onChange}
          onChangeText={this.onChangeText}
          selectTextOnFocus={true}
          value={value}
        />
        {!value && (
          <Placeholder>
            <PlaceholderText>Ethereum Address (</PlaceholderText>
            <PlaceholderText family="SFMono">0x</PlaceholderText>
            <PlaceholderText>...)</PlaceholderText>
          </Placeholder>
        )}
      </Row>
    );
  }
}
