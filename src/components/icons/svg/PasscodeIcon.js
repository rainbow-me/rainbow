import PropTypes from 'prop-types';
import React from 'react';
import { Defs, G, LinearGradient, Path, Stop } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const PasscodeIcon = ({ color, ...props }) => (
  <Svg viewBox="0 0 18 24" {...props}>
    <Defs>
      <LinearGradient id="gradient" x1="50%" x2="50%" y1="0%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="34.274%" stopColor={color} />
        <Stop offset="66.193%" stopColor={color} stopOpacity=".84" />
        <Stop offset="100%" stopColor={color} stopOpacity=".64" />
      </LinearGradient>
    </Defs>
    <G fill-rule="nonzero" fill="none">
      <Path
        d="M8.998 0c3.494 0 6.818 2.404 6.818 7.396v4.195c.98.096-3.564.11-13.636.04V7.395C2.18 2.404 5.504 0 8.998 0zm0 2.418c-2.351 0-4.296 1.681-4.296 4.742v3.36l8.592-.014V7.16c0-3.06-1.958-4.742-4.296-4.742z"
        fill="url(#gradient)"
      />
      <Path
        d="M13.193 9c1.671 0 2.277.174 2.889.5.61.328 1.09.807 1.417 1.418.327.612.501 1.218.501 2.89v5.385c0 1.671-.174 2.277-.5 2.889a3.407 3.407 0 01-1.418 1.417c-.612.327-1.218.501-2.89.501H4.808c-1.671 0-2.277-.174-2.889-.5a3.407 3.407 0 01-1.417-1.418C.174 21.47 0 20.864 0 19.192v-5.385c0-1.671.174-2.277.5-2.889a3.407 3.407 0 011.418-1.417C2.53 9.174 3.136 9 4.808 9h8.385zm-4.18 3.102c-.506 0-.878.347-.812.919l.166 2.277-1.921-1.333a.844.844 0 00-.547-.19c-.422 0-.795.339-.795.827 0 .331.174.588.53.745l2.103 1.035-2.103 1.052c-.34.157-.53.406-.53.737 0 .48.373.836.795.836.207 0 .381-.066.538-.19l1.93-1.333-.174 2.219c-.05.521.265.902.82.902.546 0 .844-.364.794-.902l-.165-2.22 1.912 1.342c.158.124.34.199.555.199.414 0 .787-.356.787-.837 0-.33-.19-.596-.53-.745l-2.112-1.06 2.112-1.043c.34-.157.53-.414.53-.745 0-.489-.373-.828-.787-.828a.916.916 0 00-.555.19l-1.929 1.342.174-2.286c.058-.58-.29-.91-.787-.91z"
        fill={color}
      />
    </G>
  </Svg>
);

PasscodeIcon.propTypes = {
  color: PropTypes.string,
};

PasscodeIcon.defaultProps = {
  color: colors.white,
};

export default PasscodeIcon;
