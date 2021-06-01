import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const WalletSwitcherCaret = ({ color, colors, ...props }) => {
  return (
    <Svg height="30" viewBox="0 0 30 30" width="30" {...props}>
      <Path
        clip-rule="evenodd"
        d="M21.888 12.7593C21.5065 12.2689 20.7997 12.1805 20.3093 12.562L15.5371 16.2736C15.2212 16.5194 14.7787 16.5194 14.4628 16.2736L9.69063 12.562C9.20019 12.1805 8.49338 12.2689 8.11193 12.7593C7.73047 13.2498 7.81882 13.9566 8.30926 14.338L13.0814 18.0497C14.2099 18.9274 15.79 18.9274 16.9185 18.0497L21.6906 14.338C22.1811 13.9566 22.2694 13.2498 21.888 12.7593Z"
        fill={color || colors.alpha(colors.blueGreyDark, 0.6)}
        fill-rule="evenodd"
      />
    </Svg>
  );
};

WalletSwitcherCaret.propTypes = {
  color: PropTypes.string,
};

export default WalletSwitcherCaret;
