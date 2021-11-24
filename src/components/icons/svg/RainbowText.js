import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-native';
// import { Path } from 'react-native-svg';
// import Svg from '../Svg';

// eslint-disable-next-line no-unused-vars
const RainbowText = ({ color, colors, ...props }) => (
  <Text style={{ fontSize: 60, fontWeight: 'bold' }}>celofi</Text>
);

RainbowText.propTypes = {
  color: PropTypes.string,
};

export default RainbowText;
