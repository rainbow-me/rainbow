import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { withRotationForDirection } from '../../../hoc';
import { colors } from '../../../styles';
import { directionPropType } from '../../../utils';
import Svg from '../Svg';

/* eslint-disable max-len */
const CaretIcon = ({
  color,
  direction,
  size,
  ...props
}) => (
  <Svg
    {...props}
    height={size ? size * 1.9 : '19'}
    width={size || '10'}
    viewBox="0 0 10 19"
  >
    <Path
      d="M.329 16.877L7.039 9.5.328 2.123A1.24 1.24 0 0 1 .467.313a1.4 1.4 0 0 1 1.905.131l7.168 7.88a1.73 1.73 0 0 1 0 2.352l-7.168 7.88a1.4 1.4 0 0 1-1.905.131 1.24 1.24 0 0 1-.138-1.81z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-disable max-len */

CaretIcon.propTypes = {
  color: PropTypes.string,
  direction: directionPropType,
  size: PropTypes.number,
};

CaretIcon.defaultProps = {
  color: colors.black,
};

export default withRotationForDirection(CaretIcon);
