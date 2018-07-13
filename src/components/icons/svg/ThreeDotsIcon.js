import PropTypes from 'prop-types';
import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../../../styles';

const ThreeDotsIcon = ({ color, ...props }) => (
  <Svg height="5" width="23" viewBox="0 0 23 5" {...props}>
    <G fill={color} fillRule="evenodd">
      <Circle cx="2.5" cy="2.5" r="2.5"/>
      <Circle cx="11.5" cy="2.5" r="2.5"/>
      <Circle cx="20.5" cy="2.5" r="2.5"/>
    </G>
  </Svg>
);

ThreeDotsIcon.propTypes = {
  color: PropTypes.string,
};

ThreeDotsIcon.defaultProps = {
  color: colors.grey,
};

export default ThreeDotsIcon;
