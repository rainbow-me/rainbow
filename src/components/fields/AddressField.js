import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components/primitives';
import { Input } from '../inputs';
import { Row } from '../layout';
import { colors } from '../../styles';
import { Label } from '../text';
import { isValidAddress } from '../../helpers/validators';
import { isHexString } from '../../handlers/web3';
import { abbreviations, addressUtils, isNewValueForPath } from '../../utils';

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

const formatValue = value => (
  (isHexString(value) && (value.length === addressUtils.maxLength))
    ? abbreviations.address(value)
    : value
);

export default class AddressField extends PureComponent {
  static propTypes = {
    address: PropTypes.string,
    autoFocus: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
  }

  state = {
    address: '',
    isValid: false,
  }

  componentDidUpdate(prevProps, prevState) {
    // Validate 'address' whenever its value changes
    if (isNewValueForPath(this.state, prevState, 'address')) {
      this.validateAddress(this.state.address);
    }

    // Allow component state to be overwritten by parent component through the
    // use of the 'address' prop. Assume that 'address' is valid because redux handles that for us.
    if (this.props.address && !this.state.address) {
      this.setState({
        address: this.props.address,
        isValid: true,
      });
    }
  }

  onChange = ({ nativeEvent }) => this.props.onChange(nativeEvent.text)

  onChangeText = address => this.setState({ address })

  validateAddress = async (inputValue) => {
    const isValid = await isValidAddress(inputValue);
    return this.setState({ isValid });
  }

  render() {
    const { autoFocus, ...props } = this.props;
    const { address, isValid } = this.state;

    return (
      <Row flex={1}>
        <AddressInput
          {...props}
          {...omit(Label.textProps, 'opacity')}
          autoCorrect={false}
          autoFocus={autoFocus}
          color={isValid ? colors.appleBlue : colors.blueGreyDark}
          maxLength={addressUtils.maxLength}
          onChange={this.onChange}
          onChangeText={this.onChangeText}
          selectTextOnFocus={true}
          value={formatValue(address)}
        />
        {!address && (
          <Placeholder>
            <PlaceholderText>ENS or Address (</PlaceholderText>
            <PlaceholderText family="SFMono">0x</PlaceholderText>
            <PlaceholderText>...)</PlaceholderText>
          </Placeholder>
        )}
      </Row>
    );
  }
}
