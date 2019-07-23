import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import { colors, fonts } from '../../styles';
import { Label } from '../text';
import { isValidAddress } from '../../helpers/validators';
import { isHexString } from '../../handlers/web3';
import { abbreviations, addressUtils, isNewValueForPath } from '../../utils';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { TextInput } from 'react-native';

const AddressInput = styled(TextInput)`
  flex-grow: 1;
  margin-top: 1;
  z-index: 1;
  font-family: ${fonts.family.SFMono};
  font-weight: ${fonts.weight.semibold};
  font-size: ${fonts.size.bmedium};
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
    contacts: PropTypes.array,
    currentContact: PropTypes.object,
  }

  state = {
    currentContact: false,
    inputValue: '',
    address: '',
    isValid: false,
    focused: true,
    forceShowNickname: false,
  }

  componentDidUpdate(props) {
    if (this.props.currentContact.nickname !== props.currentContact.nickname ) {
      this.setState({ 
        currentContact: this.props.currentContact,
        inputValue: this.props.currentContact.nickname ? this.props.currentContact.nickname : this.props.address,
        address: this.props.address,
        isValid: true,
      });
    } else if (this.props.address && !this.state.address) {
      this.setState({
        inputValue: this.props.currentContact.nickname ? this.props.currentContact.nickname : this.props.address,
        address: this.props.address,
        isValid: true,
      });
    }
  }

  onChange = ({ nativeEvent }) => {
    const contact = this.findContactByNickname(nativeEvent.text);
    if(contact) {
      this.props.onChange(contact.address);
      this.validateAddress(contact.address);
      return true;
    }
    this.props.onChange(nativeEvent.text);
    this.validateAddress(nativeEvent.text);
    return this.setState({ address: nativeEvent.text });
  }

  onChangeText = inputValue => this.setState({ inputValue });

  validateAddress = async (address) => {
    const isValid = await isValidAddress(address);
    return this.setState({ isValid });
  }

  findContactByNickname = (nickname) => {
    for (let i = 0; i < this.props.contacts.length; i++) {
      if (this.props.contacts[i].nickname == nickname) {
        return this.props.contacts[i];
      }
    }
  }

  render() {
    const { autoFocus, ...props } = this.props;
    const { inputValue, isValid } = this.state;
    
    return (
      <Row flex={1}>
        <AddressInput
          ref={x => input = x}
          {...props}
          {...omit(Label.textProps, 'opacity')}
          autoCorrect={false}
          autoFocus={autoFocus}
          color={isValid ? colors.appleBlue : colors.blueGreyDark}
          maxLength={addressUtils.maxLength}
          onChange={this.onChange}
          onChangeText={this.onChangeText}
          selectTextOnFocus={true}
          value={formatValue(inputValue)}
          onBlur={this.onBlur}
        />
        {!inputValue && (
          <Placeholder>
            <TouchableWithoutFeedback onPress={this.onPressNickName} >
              <PlaceholderText>ENS or Address (</PlaceholderText>
            </TouchableWithoutFeedback>
            <PlaceholderText family="SFMono">0x</PlaceholderText>
            <PlaceholderText>...)</PlaceholderText>
          </Placeholder>
        )}
      </Row>
    );
  }
}
