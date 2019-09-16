import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components/primitives';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { TextInput, Clipboard } from 'react-native';
import { Row } from '../layout';
import { colors, fonts } from '../../styles';
import { Label } from '../text';
import { isValidAddress } from '../../helpers/validators';
import { isHexString } from '../../handlers/web3';
import { abbreviations, addressUtils } from '../../utils';

const AddressInput = styled(TextInput)`
  flex-grow: 1;
  margin-top: 1;
  z-index: 1;
  font-family: ${fonts.family.SFProText};
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

  shouldComponentUpdate(props, state) {
    if (state.inputValue === this.state.inputValue
      && !(this.props.currentContact.nickname !== props.currentContact.nickname)
      && !(this.props.address && !this.state.address)
      && this.state.isValid === state.isValid) {
      return false;
    }
    return true;
  }

  componentDidUpdate(props) {
    if (this.props.currentContact.nickname !== props.currentContact.nickname) {
      this.setState({
        address: this.props.address,
        currentContact: this.props.currentContact,
        inputValue: this.props.currentContact.nickname ? this.props.currentContact.nickname : this.props.address,
        isValid: true,
      });
    } else if (this.props.address && !this.state.address) {
      this.setState({
        address: this.props.address,
        inputValue: this.props.currentContact.nickname ? this.props.currentContact.nickname : this.props.address,
        isValid: true,
      });
    }
  }

  onChange = ({ nativeEvent }) => {
    this.props.onChange(nativeEvent.text);
    this.validateAddress(nativeEvent.text);
    this.checkClipboard(this.state.address);
    return this.setState({ address: nativeEvent.text });
  }

  onChangeText = inputValue => this.setState({ inputValue });

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
    input.focus();
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
