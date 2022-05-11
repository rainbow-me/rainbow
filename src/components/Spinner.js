import PropTypes from 'prop-types';
import React from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import SpinnerImageSource from '../assets/spinner.png';
import { useTheme } from '../theme/ThemeContext';
import { SpinAnimation } from './animations';
import { Centered } from './layout';
import { ImgixImage } from '@rainbow-me/images';
import { position } from '@rainbow-me/styles';

const Spinner = ({ color = '', duration = 1500, size = 20, ...props }) => {
  const { colors } = useTheme();

  let style;
  switch (size) {
    case 'large':
      style = position.sizeAsObject(36);
      break;
    case 'small':
      style = position.sizeAsObject(20);
      break;
    default:
      style = position.sizeAsObject(size);
  }

  return (
    <Centered {...props}>
      {IS_TESTING !== 'true' && (
        <SpinAnimation duration={duration}>
          <ImgixImage
            source={SpinnerImageSource}
            style={style}
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

export default React.memo(Spinner);
