import PropTypes from 'prop-types';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../styles';

const CaretIcon = ({ color, ...props }) => (
  <Svg height="19" width="10" viewBox="0 0 10 19" {...props}>
    <Path
      d="M2.741 9.25l6.211 7.182a1.25 1.25 0 0 1-1.891 1.636L.426 10.395a1.75 1.75 0 0 1 0-2.29L7.061.432a1.25 1.25 0 0 1 1.891 1.636L2.742 9.25z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

CaretIcon.propTypes = {
  color: PropTypes.string,
};

CaretIcon.defaultProps = {
  color: colors.black,
};

export default CaretIcon;
