import React, { Fragment, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Input } from '../../inputs';
import { PlaceholderText } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useMagicAutofocus } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth } from '@rainbow-me/styles';

const NameInput = styled(Input).attrs({
  align: 'center',
  autoCapitalize: 'words',
  autoFocus: true,
  color: 'dark',
  letterSpacing: 'roundedTight',
  returnKeyType: 'done',
  size: 'big',
  spellCheck: false,
})`
  ${fontWithWidth(fonts.weight.heavy)};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android && 'height: 70; margin-top: -12; margin-bottom: -20;'}
  width: 100%;
`;

function ProfileNameInput(
  { onChange, placeholder, testID, value, ...props }: any,
  ref: any
) {
  const { handleFocus } = useMagicAutofocus(ref);
  const placeholderRef = useRef(null);

  const handleChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const newValue = text.charCodeAt(0) === 32 ? text.substring(1) : text;
      if (newValue.length > 0) {
        // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
        placeholderRef.current.updateValue(' ');
      } else {
        // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
        placeholderRef.current.updateValue(placeholder);
      }
      onChange(newValue);
    },
    [onChange, placeholder]
  );

  useEffect(() => {
    if (!value || value.length === 0) {
      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      placeholderRef.current.updateValue(placeholder);
    }
  }, [placeholder, value]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <PlaceholderText ref={placeholderRef} weight="heavy" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
