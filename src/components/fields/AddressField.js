import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { isHexString } from '../../handlers/web3';
import { checkIsValidAddressOrDomain } from '../../helpers/validators';
import { Input } from '../inputs';
import { Row } from '../layout';
import { Label } from '../text';
import { useClipboard, useDimensions } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { abbreviations, addressUtils } from '@rainbow-me/utils';

const AddressInput = styled(Input).attrs({
  autoCapitalize: 'none',
  autoCorrect: false,
  keyboardType: android ? 'visible-password' : 'default',
  maxLength: addressUtils.maxLength,
  selectTextOnFocus: true,
  size: 'large',
  spellCheck: false,
  weight: 'bold',
})({
  ...(android ? { height: 56 } : {}),
  flexGrow: 1,
  marginTop: 1,
  zIndex: 1,
});

const Placeholder = styled(Row)({
  marginLeft: android ? 4 : 0,
  marginTop: android ? 11 : 0,
  position: 'absolute',
  top: 0,
  zIndex: 1,
});

const PlaceholderText = styled(Label).attrs({
  size: 'large',
  weight: 'bold',
})({
  color: ({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.3),
  opacity: 1,
});

const formatValue = value =>
  isHexString(value) && value.length === addressUtils.maxLength
    ? abbreviations.address(value, 4, 4)
    : value;

const AddressField = (
  { address, autoFocus, editable, name, onChange, onFocus, testID, ...props },
  ref
) => {
  const { isTinyPhone } = useDimensions();
  const { colors } = useTheme();
  const { clipboard, setClipboard } = useClipboard();
  const [inputValue, setInputValue] = useState(address || '');
  const [isValid, setIsValid] = useState(false);

  const expandAbbreviatedClipboard = useCallback(() => {
    if (clipboard === abbreviations.formatAddressForDisplay(address)) {
      setClipboard(address);
    }
  }, [address, clipboard, setClipboard]);

  const validateAddress = useCallback(async address => {
    const newIsValid = await checkIsValidAddressOrDomain(address);
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
    if (name !== inputValue || name !== address) {
      setInputValue(name);
      validateAddress(address);
    }
  }, [address, editable, inputValue, name, validateAddress]);

  return (
    <Row flex={1}>
      <AddressInput
        {...props}
        autoFocus={autoFocus}
        color={isValid ? colors.appleBlue : colors.dark}
        editable={editable}
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
            <PlaceholderText>
              {android || isTinyPhone
                ? lang.t('fields.address.short_placeholder')
                : lang.t('fields.address.long_placeholder')}
            </PlaceholderText>
          </TouchableWithoutFeedback>
        </Placeholder>
      )}
    </Row>
  );
};

export default React.forwardRef(AddressField);
