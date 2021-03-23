import PropTypes from 'prop-types';
import React from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import SpinnerImageSource from '../assets/spinner.png';
import { useTheme } from '../context/ThemeContext';
import { SpinAnimation } from './animations';
import { Centered } from './layout';
import { ImgixImage } from '@rainbow-me/images';
import { position } from '@rainbow-me/styles';

const Spinner = ({ color, duration, size, ...props }) => {
  const { colors } = useTheme();
  return (
    <Centered {...props}>
      {IS_TESTING !== 'true' && (
        <SpinAnimation duration={duration}>
          <ImgixImage
            source={SpinnerImageSource}
            style={position.sizeAsObject(size)}
            tintColor={color || colors.whiteLabel}
          />
        </SpinAnimation>
      )}
    </Centered>
  );
};

Spinner.propTypes = {
  color: PropTypes.string,
  duration: PropTypes.number,
  size: PropTypes.number,
};

Spinner.defaultProps = {
  duration: 1500,
  size: 20,
};

export default React.memo(Spinner);
