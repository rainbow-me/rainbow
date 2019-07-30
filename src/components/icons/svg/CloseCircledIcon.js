import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const CloseCircledIcon = ({ color, ...props }) => (
  <Svg height="12" width="12" viewBox="0 0 12 12" {...props}>
    <Path
      d="M6 0C4.476 0 2.952.599 1.755 1.743a6.024 6.024 0 0 0 0 8.5 6.007 6.007 0 0 0 8.49 0 6.024 6.024 0 0 0 0-8.5C9.102.599 7.524 0 6 0zm2.285 3.105c.136 0 .273.055.382.164a.527.527 0 0 1 0 .763L6.762 5.993 8.667 7.9a.527.527 0 0 1 0 .763.588.588 0 0 1-.382.163.586.586 0 0 1-.38-.163L6 6.756 4.095 8.663a.586.586 0 0 1-.38.163.588.588 0 0 1-.382-.163.527.527 0 0 1 0-.763l1.905-1.907-1.905-1.907a.527.527 0 0 1 0-.763.526.526 0 0 1 .762 0L6 5.23l1.905-1.961a.536.536 0 0 1 .38-.164z"
      fillRule="nonzero"
      fill={color}
    />
  </Svg>
);
/* eslint-disable max-len */

CloseCircledIcon.propTypes = {
  color: PropTypes.string,
};

CloseCircledIcon.defaultProps = {
  color: colors.black,
};

export default CloseCircledIcon;
