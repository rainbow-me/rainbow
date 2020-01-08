import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const CheckmarkIcon = ({ color, ...props }) => (
  <Svg height="11" width="10" viewBox="0 0 11 10" {...props}>
    <Path
      d="9.178.236L3.108 6.51l-1.65-1.882A.856.856 0 0 0 .12 5.675L2.075 9.02a1.034 1.034 0 0 0 1.748 0c.309-.418 6.173-7.843 6.173-7.843.725-.838-.2-1.57-.818-.942z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

CheckmarkIcon.propTypes = {
  color: PropTypes.string,
};

CheckmarkIcon.defaultProps = {
  color: colors.black,
};

export default CheckmarkIcon;
