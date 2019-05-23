import PropTypes from 'prop-types';
import React from 'react';
import { TextInput } from 'react-native';
import { buildTextStyles, colors } from '../../styles';

const Input = ({
  allowFontScaling,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  placeholderTextColor,
  spellCheck,
  ...props
}) => (
  <TextInput
    {...props}
    allowFontScaling={allowFontScaling}
    autoCapitalize={autoCapitalize}
    autoCorrect={autoCorrect}
    css={buildTextStyles}
    keyboardType={keyboardType}
    placeholderTextColor={placeholderTextColor}
    spellCheck={spellCheck}
  />
);

Input.propTypes = {
  allowFontScaling: PropTypes.bool,
  autoCapitalize: PropTypes.string,
  autoCorrect: PropTypes.bool,
  keyboardType: PropTypes.oneOf([
    'decimal-pad',
    'default',
    'email-address',
    'name-phone-pad',
    'number-pad',
    'numeric',
    'phone-pad',
  ]),
  placeholderTextColor: PropTypes.string,
  spellCheck: PropTypes.bool,
};

Input.defaultProps = {
  allowFontScaling: false,
  autoCapitalize: 'none',
  autoCorrect: false,
  placeholderTextColor: colors.placeholder,
  spellCheck: true,
};

export default Input;
