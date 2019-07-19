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

const HeaderNameText = styled(Label)`
  margin-top: 0.5px;
  opacity: 1;
  background-color: white;
  z-index: 100;
  width: 300px;
  color: ${colors.appleBlue};
`;

const formatValue = value => (
  (isHexString(value) && (value.length === addressUtils.maxLength))
    ? abbreviations.address(value)
    : value
);

let input;

export default class AddressField extends PureComponent {
  static propTypes = {
    address: PropTypes.string,
    autoFocus: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
  }

  state = {
    address: '',
    isValid: false,
    focused: true,
    forceShowNickname: false,
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

  componentWillReceiveProps(props) {
    if (props.headerName !== this.props.headerName) {
      this.setState({forceShowNickname: true});
    }
  }

  onChange = ({ nativeEvent }) => this.props.onChange(nativeEvent.text)

  onChangeText = address => this.setState({ address })

  validateAddress = async (inputValue) => {
    const isValid = await isValidAddress(inputValue);
    return this.setState({ isValid });
  }

  onBlur = () => {
    this.setState({ focused: false });
  }
  onPressNickName = () => {
    this.setState({ focused: true, forceShowNickname: false });
    setTimeout(() => {
      input.focus();
    }, 50);
  }

  render() {
    const { autoFocus, headerName, ...props } = this.props;
    const { address, isValid } = this.state;
    
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
          value={formatValue(address)}
          onBlur={this.onBlur}
        />
        {!address && (
          <Placeholder>
            <TouchableWithoutFeedback onPress={this.onPressNickName} >
              <PlaceholderText>ENS or Address (</PlaceholderText>
            </TouchableWithoutFeedback>
            <PlaceholderText family="SFMono">0x</PlaceholderText>
            <PlaceholderText>...)</PlaceholderText>
          </Placeholder>
        )}
        {headerName.length > 0 && (!this.state.focused || this.state.forceShowNickname) && (
          <Placeholder>
            <TouchableWithoutFeedback onPress={this.onPressNickName} >
              <HeaderNameText>{headerName}</HeaderNameText>
            </TouchableWithoutFeedback>
          </Placeholder>
        )}
      </Row>
    );
  }
}
