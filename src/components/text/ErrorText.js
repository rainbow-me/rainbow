import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import Icon from '../icons/Icon';
import { Row } from '../layout';
import Monospace from './Monospace';
import { colors, fonts } from '../../styles';

const Text = styled(Monospace).attrs({ size: 'lmedium', weight: 'medium' })`
  line-height: ${fonts.lineHeight.looser};
  margin-left: ${fonts.size.micro};
`;

const ErrorText = ({ color, error }) => (
  <Row align="center">
    <Icon color={color} name="warning" />
    <Text color={color}>{error}</Text>
  </Row>
);

ErrorText.propTypes = {
  color: colors.propType,
  error: PropTypes.string.isRequired,
};

ErrorText.defaultProps = {
  color: colors.red,
};

export default ErrorText;
