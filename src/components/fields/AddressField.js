import * as i18n from '@/languages';
import React, { useCallback, useEffect, useState } from 'react';
import { isHexString } from '../../handlers/web3';
import { Input } from '../inputs';
import { Row } from '../layout';
import useClipboard from '@/hooks/useClipboard';
import useDimensions from '@/hooks/useDimensions';
import styled from '@/framework/ui/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';
import abbreviations from '@/utils/abbreviations';
import addressUtils from '@/utils/address';

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
  flexGrow: 1,
  marginTop: 1,
  zIndex: 1,
});

const formatValue = value => (isHexString(value) && value.length === addressUtils.maxLength ? abbreviations.address(value, 4, 4) : value);

const AddressField = ({ address, autoFocus, editable, name, isValid, onChangeText, onFocus, testID, ...props }, ref) => {
  const { isTinyPhone } = useDimensions();
  const { colors } = useTheme();
  const { clipboard, setClipboard } = useClipboard();
  const [inputValue, setInputValue] = useState(address ?? '');

  const expandAbbreviatedClipboard = useCallback(() => {
    if (clipboard === abbreviations.formatAddressForDisplay(address)) {
      setClipboard(address);
    }
  }, [address, clipboard, setClipboard]);

  const handleChangeText = useCallback(
    text => {
      expandAbbreviatedClipboard();
      setInputValue(text);
      onChangeText(text);
    },
    [setInputValue, expandAbbreviatedClipboard, onChangeText]
  );

  useEffect(() => {
    if (name !== inputValue || name !== address) {
      setInputValue(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, editable, name]);

  return (
    <Row flex={1}>
      <AddressInput
        {...props}
        autoFocus={autoFocus}
        color={isValid ? colors.appleBlue : colors.dark}
        editable={editable}
        onBlur={expandAbbreviatedClipboard}
        onChangeText={handleChangeText}
        onFocus={onFocus}
        ref={ref}
        testID={testID}
        value={formatValue(inputValue)}
        placeholder={
          android || isTinyPhone ? i18n.t(i18n.l.fields.address.short_placeholder) : i18n.t(i18n.l.fields.address.long_placeholder)
        }
        placeholderTextColor={opacity(colors.blueGreyDark, 0.3)}
      />
    </Row>
  );
};

export default React.forwardRef(AddressField);
