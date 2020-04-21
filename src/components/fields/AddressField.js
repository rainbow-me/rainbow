import Clipboard from '@react-native-community/clipboard';
import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Platform } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { withNavigation } from 'react-navigation';
import styled from 'styled-components/primitives';
import { isHexString } from '../../handlers/web3';
import { checkIsValidAddress } from '../../helpers/validators';
import { colors } from '../../styles';
import { abbreviations, addressUtils, isNewValueForPath } from '../../utils';
import { Input } from '../inputs';
import { Row } from '../layout';
import { Label } from '../text';

const Placeholder = styled(Row)`
  margin-top: ${Platform.OS === 'android' ? 13 : 0};
  position: absolute;
  top: 0;
  z-index: 1;
`;

const PlaceholderText = styled(Label)`
  opacity: 0.45;
`;

const formatValue = value =>
  isHexString(value) && value.length === addressUtils.maxLength
    ? abbreviations.address(value, 4, 10)
    : value;

export default withNavigation(
  class AddressField extends React.Component {
    static propTypes = {
      address: PropTypes.string,
      autoFocus: PropTypes.bool,
      currentContact: PropTypes.object,
      onChange: PropTypes.func.isRequired,
    };

    state = {
      address: '',
      currentContact: false,
      inputValue: '',
      isValid: false,
    };

    componentDidMount() {
      this.focusListener = this.props.navigation.addListener('refocus', () =>
        this.inputRef.focus()
      );
    }

    shouldComponentUpdate(nextProps, nextState) {
      const isNewAddress = isNewValueForPath(nextProps, this.state, 'address');
      const isNewInputValue = isNewValueForPath(
        this.state,
        nextState,
        'inputValue'
      );
      const isNewNickname = isNewValueForPath(
        this.props,
        nextProps,
        'currentContact.nickname'
      );
      const isNewValid = isNewValueForPath(this.state, nextState, 'isValid');
      return isNewAddress || isNewInputValue || isNewNickname || isNewValid;
    }

    componentDidUpdate(prevProps) {
      const { address, currentContact } = this.props;

      const isNewNickname = isNewValueForPath(
        this.props,
        prevProps,
        'currentContact.nickname'
      );
      const isNewAddress = address !== this.state.address;

      if (isNewAddress || isNewNickname) {
        const newState = {
          address,
          inputValue: currentContact.nickname
            ? currentContact.nickname
            : address,
          isValid: true,
        };

        if (isNewNickname) {
          newState.currentContact = currentContact;
        }

        // eslint-disable-next-line react/no-did-update-set-state
        this.setState(newState);
      }
    }

    componentWillUnmount() {
      this.focusListener.remove();
    }

    inputRef = undefined;

    handleInputRef = ref => {
      this.inputRef = ref;
      this.props.inputRef(ref);
    };

    onChange = ({ nativeEvent: { text } }) => {
      this.props.onChange(text);
      this.validateAddress(text);
      this.checkClipboard(this.state.address);
      return this.setState({ address: text });
    };

    onChangeText = inputValue => this.setState({ inputValue });

    validateAddress = async address => {
      const isValid = await checkIsValidAddress(address);
      return this.setState({ isValid });
    };

    onBlur = () => {
      this.checkClipboard(this.state.address);
      if (this.props.onBlur) {
        this.props.onBlur();
      }
    };

    checkClipboard = async address => {
      const clipboard = await Clipboard.getString();
      if (abbreviations.address(address, 4, 10) === clipboard) {
        Clipboard.setString(address);
      }
    };

    onPressNickname = () => {
      this.inputRef.focus();
    };

    render() {
      const { autoFocus, ...props } = this.props;
      const { inputValue, isValid } = this.state;

      return (
        <Row flex={1}>
          <Input
            {...props}
            {...omit(Label.textProps, 'opacity')}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            color={isValid ? colors.appleBlue : colors.blueGreyDark}
            keyboardType={
              Platform.OS === 'android' ? 'visible-password' : 'default'
            }
            maxLength={addressUtils.maxLength}
            onBlur={this.onBlur}
            onChange={this.onChange}
            onChangeText={this.onChangeText}
            ref={this.handleInputRef}
            selectTextOnFocus
            spellCheck={false}
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
              <TouchableWithoutFeedback onPress={this.onPressNickname}>
                <PlaceholderText>ENS or Address (0x...)</PlaceholderText>
              </TouchableWithoutFeedback>
            </Placeholder>
          )}
        </Row>
      );
    }
  }
);
