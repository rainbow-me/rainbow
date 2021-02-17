import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const WarningCircledIcon = ({ color, colors, ...props }) => (
  <View
    style={{
      backgroundColor: color || colors.yellowOrange,
      borderRadius: 22,
      height: 22,
      width: 22,
    }}
    {...props}
  >
    <Svg height="20" viewBox="0 0 20 20" width="20">
      <Path
        d="M10.9987 12.4706C10.3126 12.4706 9.92892 12.0869 9.90566 11.3892L9.73124 6.05198C9.70799 5.34268 10.2312 4.83105 10.9871 4.83105C11.7312 4.83105 12.2778 5.35431 12.2545 6.06361L12.0801 11.3776C12.0452 12.0869 11.6615 12.4706 10.9987 12.4706ZM10.9987 16.8311C10.2196 16.8311 9.58008 16.2845 9.58008 15.5055C9.58008 14.7264 10.2196 14.1799 10.9987 14.1799C11.7778 14.1799 12.4173 14.7148 12.4173 15.5055C12.4173 16.2962 11.7661 16.8311 10.9987 16.8311Z"
        fill="white"
      />
    </Svg>
  </View>
);

WarningCircledIcon.propTypes = {
  color: PropTypes.string,
};

export default WarningCircledIcon;
