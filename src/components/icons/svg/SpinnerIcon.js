import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import { SpinAnimation } from '../../animations';
import Svg from '../Svg';

const SpinnerIcon = ({ color, colors, size }) => (
  <SpinAnimation>
    <Svg height={size} width={size}>
      <Path
        d="M11.5 5.75a.75.75 0 1 1-1.5 0A4.25 4.25 0 1 0 5.75 10a.75.75 0 0 1 0 1.5 5.75 5.75 0 1 1 5.75-5.75z"
        fill={color || colors.appleBlue}
      />
    </Svg>
  </SpinAnimation>
);

SpinnerIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

SpinnerIcon.defaultProps = {
  size: 12,
};

export default SpinnerIcon;
