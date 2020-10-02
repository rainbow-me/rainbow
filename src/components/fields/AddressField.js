import React, { useCallback, useEffect, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { isHexString } from '../../handlers/web3';
import { checkIsValidAddressOrENS } from '../../helpers/validators';
import { Input } from '../inputs';
import { Row } from '../layout';
import { Label } from '../text';
import { useClipboard } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';
import { abbreviations, addressUtils } from '@rainbow-me/utils';

const AddressInput = styled(Input).attrs({
  autoCapitalize: 'none',
  autoCorrect: false,
  keyboardType: android ? 'visible-password' : 'default',
  maxLength: addressUtils.maxLength,
  selectTextOnFocus: true,
  size: 'bmedium',
  spellCheck: false,
  weight: 'semibold',
})`
  flex-grow: 1;
  margin-top: ${android ? 6 : 1};
  z-index: 1;
`;

const Placeholder = styled(Row)`
  margin-left: ${android ? 3 : 0};
  margin-top: ${android ? 12 : 0};
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

const AddressField = (
  { address, autoFocus, name, onChange, onFocus, testID, ...props },
  ref
) => {
  const { clipboard, setClipboard } = useClipboard();
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  const expandAbbreviatedClipboard = useCallback(() => {
    if (clipboard === abbreviations.formatAddressForDisplay(address)) {
      setClipboard(address);
    }
  }, [address, clipboard, setClipboard]);

  const validateAddress = useCallback(async address => {
    const newIsValid = await checkIsValidAddressOrENS(address);
    return setIsValid(newIsValid);
  }, []);

  const handleChange = useCallback(
    ({ nativeEvent: { text } }) => {
      onChange(text);
      validateAddress(text);
      expandAbbreviatedClipboard();
    },
    [expandAbbreviatedClipboard, onChange, validateAddress]
  );

  useEffect(() => {
    if (address !== inputValue || name !== inputValue) {
      setInputValue(name || address);
      setIsValid(true);
    }
  }, [address, inputValue, name]);

  return (
    <Row flex={1}>
      <AddressInput
        {...props}
        autoFocus={autoFocus}
        color={isValid ? colors.appleBlue : colors.blueGreyDark}
        onBlur={expandAbbreviatedClipboard}
        onChange={handleChange}
        onChangeText={setInputValue}
        onFocus={onFocus}
        ref={ref}
        testID={testID}
        value={formatValue(inputValue)}
      />
      {!inputValue && (
        <Placeholder>
          <TouchableWithoutFeedback onPress={ref?.current?.focus}>
            <PlaceholderText>ENS or Address (0x...)</PlaceholderText>
          </TouchableWithoutFeedback>
        </Placeholder>
      )}
    </Row>
  );
};

export default React.forwardRef(AddressField);
