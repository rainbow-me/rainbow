import PropTypes from 'prop-types';
import React from 'react';
import { Circle, G, Path } from 'react-native-svg';
import Svg from '../Svg';

const ThreeDotsIcon = ({ circle, color, colors, smallDots, tightDots, ...props }) =>
  smallDots ? (
    <Svg height="4" viewBox="0 0 18 4" width="18" {...props}>
      <Path
        d="M4.75 2C4.75 3.10457 3.85457 4 2.75 4C1.64543 4 0.75 3.10457 0.75 2C0.75 0.895431 1.64543 0 2.75 0C3.85457 0 4.75 0.895431 4.75 2Z"
        fill={color || colors.alpha(colors.blueGreyDark, 0.8)}
      />
      <Path
        d="M11 2C11 3.10457 10.1046 4 9 4C7.89543 4 7 3.10457 7 2C7 0.895431 7.89543 0 9 0C10.1046 0 11 0.895431 11 2Z"
        fill={color || colors.alpha(colors.blueGreyDark, 0.8)}
      />
      <Path
        d="M15.25 4C16.3546 4 17.25 3.10457 17.25 2C17.25 0.895431 16.3546 0 15.25 0C14.1454 0 13.25 0.895431 13.25 2C13.25 3.10457 14.1454 4 15.25 4Z"
        fill={color || colors.alpha(colors.blueGreyDark, 0.8)}
      />
    </Svg>
  ) : (
    <Svg
      height={circle ? '25' : '5'}
      viewBox={tightDots ? (circle ? '-7 0 35 5' : '0 0 21 5') : '0 0 23 5'}
      width={tightDots ? 21 : 23}
      {...props}
    >
      <G fill={color || colors.grey} fillRule="evenodd">
        <Circle cx="10" cy="2" fill="transparent" r="15" stroke={color || colors.grey} strokeWidth="2.5" />
        <Circle cx="2.5" cy="2.5" r="2.5" />
        <Circle cx={tightDots ? '10.5' : '11.5'} cy="2.5" r="2.5" />
        <Circle cx={tightDots ? '18.5' : '20.5'} cy="2.5" r="2.5" />
      </G>
    </Svg>
  );

ThreeDotsIcon.propTypes = {
  color: PropTypes.string,
  smallDots: PropTypes.bool,
  tightDots: PropTypes.bool,
};

export default ThreeDotsIcon;
