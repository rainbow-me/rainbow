import PropTypes from 'prop-types';
import React from 'react';
import { Circle, G, Path } from 'react-native-svg';
import Svg from '../Svg';

const ClockIcon = ({ color, colors, ...props }) => (
  <Svg viewBox="0 0 30 30" {...props}>
    <G fill="none" fillRule="nonzero">
      <Circle cx="15" cy="15" r="13.875" stroke={color || colors.black} strokeWidth="2.25" />
      <Path
        d="M15.3 14.726l5.16 2.98c.232.133.302.206.36.3a.545.545 0 0 1 .083.31c-.003.11-.028.208-.161.44l-.356.616c-.134.232-.207.302-.3.36a.545.545 0 0 1-.31.084c-.111-.004-.21-.028-.44-.162l-5.722-3.303a1.122 1.122 0 0 1-.564-.976V8.769c0-.267.028-.364.08-.462a.545.545 0 0 1 .227-.227c.098-.052.195-.08.462-.08h.712c.267 0 .364.028.462.08a.545.545 0 0 1 .227.227c.052.098.08.195.08.462v5.957z"
        fill={color || colors.black}
      />
    </G>
  </Svg>
);

ClockIcon.propTypes = {
  color: PropTypes.string,
};

export default ClockIcon;
