import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const WalletConnectIcon = ({ color, colors, ...props }) => {
  return (
    <Svg height="19" viewBox="0 0 31 19" width="31" {...props}>
      <Path
        d="M6.346 3.712c5.056-4.95 13.252-4.95 18.308 0l.608.596a.624.624 0 0 1 0 .896l-2.081 2.038a.329.329 0 0 1-.458 0l-.837-.82c-3.527-3.453-9.245-3.453-12.772 0l-.896.878a.329.329 0 0 1-.458 0L5.679 5.262a.624.624 0 0 1 0-.896l.667-.654zm22.612 4.215L30.81 9.74a.624.624 0 0 1 0 .896l-8.352 8.178a.657.657 0 0 1-.915 0l-5.929-5.804a.164.164 0 0 0-.228 0l-5.928 5.804a.657.657 0 0 1-.916 0L.19 10.636a.624.624 0 0 1 0-.896l1.852-1.813a.657.657 0 0 1 .915 0l5.928 5.804a.164.164 0 0 0 .23 0l5.927-5.804a.657.657 0 0 1 .916 0l5.928 5.804a.164.164 0 0 0 .229 0l5.928-5.804a.657.657 0 0 1 .915 0z"
        fill={color || colors.white}
        fillRule="nonzero"
      />
    </Svg>
  );
};

WalletConnectIcon.propTypes = {
  color: PropTypes.string,
};

export default WalletConnectIcon;
