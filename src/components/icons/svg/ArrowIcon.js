import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { withRotationForDirection } from '../../../hoc';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const ArrowIcon = ({
  color,
  height,
  width,
  ...props
}) => (
  <Svg height={height} width={width} {...props}>
    <Path
      d="M5.614 4.186v1.92a.349.349 0 0 0 .552.278L9.554 3.56a.344.344 0 0 0 0-.562L6.166.174a.349.349 0 0 0-.552.278v1.922H1.41a.77.77 0 0 0-.77.77v.272c0 .425.345.77.77.77h4.204z"
      fill={color}
    />
  </Svg>
);
/* eslint-disable max-len */

ArrowIcon.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
};

ArrowIcon.defaultProps = {
  color: colors.black,
  height: 7,
  width: 10,
};

export default withRotationForDirection(ArrowIcon);
