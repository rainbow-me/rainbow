import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components/primitives';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Clipboard } from 'react-native';
import { isValidAddress } from '../../helpers/validators';
import { isHexString } from '../../handlers/web3';
import { colors, fonts } from '../../styles';
import { abbreviations, addressUtils, isNewValueForPath } from '../../utils';
import { Input } from '../inputs';
import { Row } from '../layout';
import { Label } from '../text';

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
    ? abbreviations.address(value, 4, 10)
    : value
);

export default class AddressField extends PureComponent {
  static propTypes = {
    address: PropTypes.string,
    autoFocus: PropTypes.bool,
    contacts: PropTypes.array,
    currentContact: PropTypes.object,
    onChange: PropTypes.func.isRequired,
  }

  state = {
    address: '',
    currentContact: false,
    inputValue: '',
    isValid: false,
  }

  inputRef = undefined

  shouldComponentUpdate(nextProps, nextState) {
    const isNewAddress = isNewValueForPath(this.props, this.state, 'address');
    const isNewInputValue = isNewValueForPath(this.state, nextState, 'inputValue');
    const isNewNickname = isNewValueForPath(this.props, nextProps, 'currentContact.nickname');
    const isNewValid = isNewValueForPath(this.state, nextState, 'isValid');
    return (
      isNewAddress
      || isNewInputValue
      || isNewNickname
      || isNewValid
    );
  }

  componentDidUpdate(prevProps) {
    const { address, currentContact } = this.props;

    const isNewNickname = isNewValueForPath(this.props, prevProps, 'currentContact.nickname');
    const isNewAddress = address !== this.state.address;

    if (isNewAddress || isNewNickname) {
      const newState = {
        address,
        inputValue: currentContact.nickname ? currentContact.nickname : address,
        isValid: true,
      };

      if (isNewNickname) {
        newState.currentContact = currentContact;
      }

      this.setState(newState);
    }
  }

  handleInputRef = (ref) => { this.inputRef = ref; }

  onChange = ({ nativeEvent: { text } }) => {
    this.props.onChange(text);
    this.validateAddress(text);
    this.checkClipboard(this.state.address);
    return this.setState({ address: text });
  }

  onChangeText = inputValue => this.setState({ inputValue })

  validateAddress = async (address) => {
    const isValid = await isValidAddress(address);
    return this.setState({ isValid });
  }

  onBlur = () => {
    this.checkClipboard(this.state.address);
  }

  checkClipboard = async (address) => {
    const clipboard = await Clipboard.getString();
    if (abbreviations.address(address, 4, 10) === clipboard) {
      Clipboard.setString(address);
    }
  }

  onPressNickname = () => {
    this.inputRef.focus();
  }

  render() {
    const { autoFocus, ...props } = this.props;
    const { inputValue, isValid } = this.state;

    return (
      <Row flex={1}>
        <Input
          {...props}
          {...omit(Label.textProps, 'opacity')}
          autoCorrect={false}
          autoFocus={autoFocus}
          color={isValid ? colors.appleBlue : colors.blueGreyDark}
          maxLength={addressUtils.maxLength}
          onBlur={this.onBlur}
          onChange={this.onChange}
          onChangeText={this.onChangeText}
          ref={this.handleInputRef}
          selectTextOnFocus={true}
          spellCheck={true}
          size="bmedium"
          style={{
            flexGrow: 1,
            marginTop: 1,
            zIndex: 1,
          }}
          value={formatValue(inputValue)}
          weight="semibold"
        />
        {!inputValue && (
          <Placeholder>
            <TouchableWithoutFeedback onPress={this.onPressNickname} >
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
