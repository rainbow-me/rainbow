import PropTypes from 'prop-types';
import React from 'react';
import { Circle, G } from 'react-native-svg';
import Svg from '../Svg';
import { colors } from '@rainbow-me/styles';

const ThreeDotsIcon = ({ color, tightDots, ...props }) => (
  <Svg
    height="5"
    width={tightDots ? 21 : 23}
    viewBox={tightDots ? '0 0 21 5' : '0 0 23 5'}
    {...props}
  >
    <G fill={color} fillRule="evenodd">
      <Circle cx="2.5" cy="2.5" r="2.5" />
      <Circle cx={tightDots ? '10.5' : '11.5'} cy="2.5" r="2.5" />
      <Circle cx={tightDots ? '18.5' : '20.5'} cy="2.5" r="2.5" />
    </G>
  </Svg>
);

ThreeDotsIcon.propTypes = {
  color: PropTypes.string,
  tightDots: PropTypes.bool,
};

ThreeDotsIcon.defaultProps = {
  color: colors.grey,
};

export default ThreeDotsIcon;
