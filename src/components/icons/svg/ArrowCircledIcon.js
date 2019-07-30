import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { withRotationForDirection } from '../../../hoc';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const ArrowCircledIcon = ({ color, ...props }) => (
  <Svg height="15" width="14" viewBox="0 0 14 15" {...props}>
    <Path
      d="M6.222 1.633V8.75l-2.18-2.186a.778.778 0 0 0-1.1 1.102l3.501 3.508a.777.777 0 0 0 1.1 0l3.502-3.508a.778.778 0 0 0-1.1-1.102L7.778 8.738V1.633c0-.58.507-1.036 1.066-.883a7 7 0 1 1-3.687 0c.558-.153 1.065.303 1.065.883z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-disable max-len */

ArrowCircledIcon.propTypes = {
  color: PropTypes.string,
};

ArrowCircledIcon.defaultProps = {
  color: colors.black,
};

export default withRotationForDirection(ArrowCircledIcon);
