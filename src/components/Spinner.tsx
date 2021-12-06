import PropTypes from 'prop-types';
import React from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import SpinnerImageSource from '../assets/spinner.png';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import { SpinAnimation } from './animations';
import { Centered } from './layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const Spinner = ({ color, duration, size, ...props }: any) => {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered {...props}>
      {IS_TESTING !== 'true' && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SpinAnimation duration={duration}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
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

Spinner.defaultProps = {
  duration: 1500,
  size: 20,
};

export default React.memo(Spinner);
