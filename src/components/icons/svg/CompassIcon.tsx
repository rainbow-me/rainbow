import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const CompassIcon = ({ color, size, colors, ...props }) => (
  <Svg height={size || 17} viewBox="0 0 17 17" width={size || 17} {...props}>
    <Path
      d="M5.35212 12.4316L9.78514 10.3818C10.0698 10.2517 10.265 10.0565 10.3952 9.7799L12.4287 5.34688C12.7052 4.74497 12.266 4.28133 11.6397 4.56602L7.2148 6.59951C6.93825 6.72966 6.75117 6.91674 6.61289 7.20956L4.56313 11.6507C4.29471 12.2445 4.75834 12.7 5.35212 12.4316ZM8.49997 9.56028C7.92246 9.56028 7.45069 9.08851 7.45069 8.511C7.45069 7.93348 7.92246 7.45358 8.49997 7.45358C9.08562 7.45358 9.54925 7.93348 9.54925 8.511C9.54925 9.08851 9.08562 9.56028 8.49997 9.56028Z"
      fill={color || colors.white}
      fillRule="nonzero"
    />
    <Path
      d="M8.5 17C13.1944 17 17 13.1944 17 8.5C17 3.80557 13.1944 0 8.5 0C3.8056 0 0 3.80557 0 8.5C0 13.1944 3.8056 17 8.5 17ZM8.5 15.09C12.1395 15.09 15.09 12.1396 15.09 8.5C15.09 4.86044 12.1395 1.91 8.5 1.91C4.86041 1.91 1.90997 4.86044 1.90997 8.5C1.90997 12.1396 4.86041 15.09 8.5 15.09Z"
      fill={color || colors.white}
      fillRule="evenodd"
    />
  </Svg>
);

CompassIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

export default CompassIcon;
