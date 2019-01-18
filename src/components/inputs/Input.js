import PropTypes from 'prop-types';
import React from 'react';
import { TextInput } from 'react-native';
import styled from 'styled-components';
import { buildTextStyles, colors } from '../../styles';

const StyledInput = styled(TextInput)`
  ${buildTextStyles}
`;

const Input = ({
  autoCapitalize,
  autoCorrect,
  placeholderTextColor,
  spellCheck,
  ...props
}) => (
  <StyledInput
    {...props}
    allowFontScaling={false}
    autoCapitalize={autoCapitalize}
    autoCorrect={autoCorrect}
    placeholderTextColor={placeholderTextColor}
    spellCheck={spellCheck}
  />
);

Input.propTypes = {
  autoCapitalize: PropTypes.string,
  autoCorrect: PropTypes.bool,
  placeholderTextColor: PropTypes.string,
  spellCheck: PropTypes.bool,
};

Input.defaultProps = {
  autoCapitalize: 'none',
  autoCorrect: false,
  placeholderTextColor: colors.placeholder,
  spellCheck: true,
};

export default Input;
