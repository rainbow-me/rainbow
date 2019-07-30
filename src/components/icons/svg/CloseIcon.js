import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const CloseIcon = ({ color, size, ...props }) => (
  <Svg height={size} width={size} viewBox="0 0 12 12" {...props}>
    <Path
      d="M11.742 11.75a.857.857 0 0 1-1.212 0L5.992 7.213l-4.532 4.53a.857.857 0 0 1-1.212-1.21l4.533-4.53-4.532-4.53A.856.856 0 0 1 1.46.264l4.533 4.529L10.529.259a.857.857 0 1 1 1.212 1.21L7.204 6.004l4.538 4.535a.856.856 0 0 1 0 1.211z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-disable max-len */

CloseIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

CloseIcon.defaultProps = {
  color: colors.black,
  size: 12,
};

export default CloseIcon;
