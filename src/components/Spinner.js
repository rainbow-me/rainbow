import PropTypes from 'prop-types';
import React from 'react';
import SpinnerImageSource from '../assets/spinner.png';
import ImgixImage from './ImgixImage';
import { SpinAnimation } from './animations';
import { Centered } from './layout';
import { colors, position } from '@rainbow-me/styles';

const Spinner = ({ color, duration, size, ...props }) => (
  <Centered {...props}>
    <SpinAnimation duration={duration}>
      <ImgixImage
        source={SpinnerImageSource}
        style={position.sizeAsObject(size)}
        tintColor={color}
      />
    </SpinAnimation>
  </Centered>
);

Spinner.propTypes = {
  color: PropTypes.string,
  duration: PropTypes.number,
  size: PropTypes.number,
};

Spinner.defaultProps = {
  color: colors.white,
  duration: 1500,
  size: 20,
};

export default React.memo(Spinner);
