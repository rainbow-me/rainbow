import PropTypes from 'prop-types';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../styles';

const BalanceLogoIcon = ({ color, ...props }) => (
  <Svg height="46" width="43" viewBox="0 0 43 46" {...props}>
    <Path
      d="M24.9.903a6.851 6.851 0 0 0-6.8 0L3.9 9.03a6.729 6.729 0 0 0-3.4 5.836v4.525l6.823 3.905v-7.118c0-.803.432-1.545 1.134-1.946l19.867-11.37-3.425-1.96zM22.633 38.571a2.284 2.284 0 0 1-2.266 0L.5 27.201v3.92a6.729 6.729 0 0 0 3.4 5.836l14.2 8.127a6.85 6.85 0 0 0 6.8 0l3.953-2.262v-7.81l-6.22 3.56zM35.147 6.768l-6.823 3.905 6.22 3.56a2.243 2.243 0 0 1 1.133 1.944v22.74l3.424-1.96a6.728 6.728 0 0 0 3.399-5.836V14.866a6.729 6.729 0 0 0-3.4-5.836l-3.953-2.262z"
      fill={color}
      fillRule="evenodd"
    />
  </Svg>
);

BalanceLogoIcon.propTypes = {
  color: PropTypes.string,
};

BalanceLogoIcon.defaultProps = {
  color: colors.white,
};

export default BalanceLogoIcon;
