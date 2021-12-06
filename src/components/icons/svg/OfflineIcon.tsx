import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const OfflineIcon = ({ color, colors, ...props }) => (
  <Svg height="15" viewBox="0 0 15 19" width="19" {...props}>
    <Path
      d="M10.775 2.097l-6.79 6.79-.185.184-2.385 2.385A3.802 3.802 0 0 1 2.87 4.812 4.815 4.815 0 0 1 7.6.898c1.218 0 2.327.452 3.175 1.199zM19 9.257a3.04 3.04 0 0 1-3.04 3.04H4.875l-2.057 2.058-1.076-1.075 1.104-1.104.954-.954 3.357-3.357.321-.32 1.137-1.137 3.135-3.135.724-.724L14.499.524a.5.5 0 0 1 .707 0l.722.721-1.65 1.65c.483.212.913.514 1.268.883a3.684 3.684 0 0 1 1.045 2.504A3.043 3.043 0 0 1 19 9.258z"
      fill={color || colors.black}
      fillRule="evenodd"
    />
  </Svg>
);

OfflineIcon.propTypes = {
  color: PropTypes.string,
};

export default OfflineIcon;
