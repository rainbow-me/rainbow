import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const WarningIcon = ({ color, ...props }) => (
  <Svg height="14" width="15" viewBox="0 0 14 15" {...props}>
    <Path
      d="M7.504 0c.637 0 1.274.322 1.625.952l5.62 10.06c.172.3.251.616.251.93 0 1.032-.752 1.89-1.883 1.89H1.89c-1.138 0-1.89-.858-1.89-1.89 0-.314.079-.63.25-.923L5.872.952C6.215.322 6.866 0 7.504 0zm0 9.866c-.53 0-.924.337-.924.845 0 .501.4.845.924.845.522 0 .923-.336.923-.845 0-.508-.4-.845-.923-.845zm-.008-5.649c-.5 0-.852.337-.83.816l.107 3.093c.022.459.28.71.73.71.444 0 .702-.244.724-.717l.114-3.078c.022-.48-.343-.824-.845-.824z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-disable max-len */

WarningIcon.propTypes = {
  color: PropTypes.string,
};

WarningIcon.defaultProps = {
  color: colors.black,
};

export default WarningIcon;
