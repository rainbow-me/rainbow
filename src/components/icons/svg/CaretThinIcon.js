import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { withRotationForDirection } from '../../../hoc';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const CaretThinIcon = ({ color, ...props }) => (
  <Svg
    height="14"
    viewBox="0 0 7 14"
    width="7"
    {...props}
  >
    <Path
      d="M.317 12.203a.875.875 0 1 0 1.366 1.094l4.15-5.188a1.375 1.375 0 0 0 0-1.718l-4.15-5.188A.875.875 0 1 0 .317 2.297L4.279 7.25.317 12.203z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-enable max-len */

CaretThinIcon.propTypes = {
  color: PropTypes.string,
};

CaretThinIcon.defaultProps = {
  color: colors.black,
};

export default withRotationForDirection(CaretThinIcon);
