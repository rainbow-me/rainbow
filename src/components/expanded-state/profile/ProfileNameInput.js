import React, { Fragment, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components/primitives';
import { Input } from '../../inputs';
import { PlaceholderText } from '../../text';
import { useMagicAutofocus } from '@rainbow-me/hooks';
import { fonts, fontWithWidth } from '@rainbow-me/styles';

const NameInput = styled(Input).attrs({
  align: 'center',
  autoCapitalize: 'words',
  autoFocus: true,
  letterSpacing: 'roundedTight',
  returnKeyType: 'done',
  size: 'big',
  spellCheck: false,
})`
  ${fontWithWidth(fonts.weight.bold)};
  ${android ? 'height: 70; margin-vertical: -8;' : ''}
  width: 100%;
`;

function ProfileNameInput(
  { onChange, placeholder, testID, value, ...props },
  ref
) {
  const { handleFocus } = useMagicAutofocus(ref);
  const placeholderRef = useRef(null);

  const handleChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const newValue = text.charCodeAt(0) === 32 ? text.substring(1) : text;
      if (newValue.length > 0) {
        placeholderRef.current.updateValue(' ');
      } else {
        placeholderRef.current.updateValue(placeholder);
      }
      onChange(newValue);
    },
    [onChange, placeholder]
  );

  useEffect(() => {
    if (!value || value.length === 0) {
      placeholderRef.current.updateValue(placeholder);
    }
  }, [placeholder, value]);

  return (
    <Fragment>
      <PlaceholderText ref={placeholderRef} />
      <NameInput
        {...props}
        onChange={handleChange}
        onFocus={handleFocus}
        ref={ref}
        testID={testID}
        value={value}
      />
    </Fragment>
  );
}

export default React.forwardRef(ProfileNameInput);
