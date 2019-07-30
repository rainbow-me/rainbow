import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const CheckmarkCircledIcon = ({ color, ...props }) => (
  <Svg height="20" width="21" viewBox="0 0 20 21" {...props}>
    <Path
      d="M10 .75c5.523 0 10 4.477 10 10s-4.477 10-10 10-10-4.477-10-10 4.477-10 10-10zm3.985 5.6l-6.07 6.274-1.65-1.882a.856.856 0 0 0-1.338 1.047l1.954 3.346a1.034 1.034 0 0 0 1.749 0c.308-.418 6.173-7.843 6.173-7.843.725-.838-.201-1.57-.818-.942z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-enable max-len */

CheckmarkCircledIcon.propTypes = {
  color: PropTypes.string,
};

CheckmarkCircledIcon.defaultProps = {
  color: colors.black,
};

export default CheckmarkCircledIcon;
