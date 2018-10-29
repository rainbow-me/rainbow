import PropTypes from 'prop-types';
import React from 'react';
import Svg, { Path } from 'svgs';
import { colors } from '../../../styles';

const ShareIcon = ({ color, size, ...props }) => (
  <Svg height={size || 24} width={size || 24} viewBox="0 0 1000 1000" {...props}>
    <Path
      d="M381.9,181l95.8-95.8v525.9c0,13.4,8.9,22.3,22.3,22.3c13.4,0,22.3-8.9,22.3-22.3V85.2l95.8,95.8c4.5,4.5,8.9,6.7,15.6,6.7c6.7,0,11.1-2.2,15.6-6.7c8.9-8.9,8.9-22.3,0-31.2L515.6,16.1c-2.2-2.2-4.5-4.5-6.7-4.5c-4.5-2.2-11.1-2.2-17.8,0c-2.2,2.2-4.5,2.2-6.7,4.5L350.7,149.8c-8.9,8.9-8.9,22.3,0,31.2C359.6,190,373,190,381.9,181z M812,276.9H633.7v44.6H812v624H188v-624h178.3v-44.6H188c-24.5,0-44.6,20.1-44.6,44.6v624c0,24.5,20.1,44.6,44.6,44.6h624c24.5,0,44.6-20.1,44.6-44.6v-624C856.6,296.9,836.5,276.9,812,276.9z"
      fill={color}
      fillRule="evenodd"
    />
  </Svg>
);

ShareIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

ShareIcon.defaultProps = {
  color: colors.white,
};

export default ShareIcon;
