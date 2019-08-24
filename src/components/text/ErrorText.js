import PropTypes from 'prop-types';
import React from 'react';
import { withNeverRerender } from '../../hoc';
import { colors, fonts } from '../../styles';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import Monospace from './Monospace';

const ErrorText = ({ color, error }) => (
  <RowWithMargins align="center" margin={fonts.size.micro}>
    <Icon
      color={color}
      name="warning"
    />
    <Monospace
      color={color}
      lineHeight="looser"
      size="lmedium"
      weight="medium"
    >
      {error}
    </Monospace>
  </RowWithMargins>
);

ErrorText.propTypes = {
  color: colors.propType,
  error: PropTypes.string.isRequired,
};

ErrorText.defaultProps = {
  color: colors.red,
};

export default withNeverRerender(ErrorText);
