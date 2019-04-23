import PropTypes from 'prop-types';
import React from 'react';
import { CircularProgress } from 'react-native-circular-progress';
import RequestVendorLogoIcon from './RequestVendorLogoIcon';

const RequestCoinIconSize = 48;

const RequestCoinIcon = ({
  dappName,
  expirationColor,
  percentElapsed,
  size,
}) => (
  <CircularProgress
    fill={percentElapsed}
    lineCap="round"
    prefill={percentElapsed}
    rotation={0}
    size={size}
    tintColor={expirationColor}
    width={2}
  >
    {() => (
      <RequestVendorLogoIcon
        borderRadius={size}
        dappName={dappName}
      />
    )}
  </CircularProgress>
);

RequestCoinIcon.propTypes = {
  dappName: PropTypes.string,
  expirationColor: PropTypes.string,
  percentElapsed: PropTypes.number,
  size: PropTypes.number,
};

RequestCoinIcon.defaultProps = {
  size: RequestCoinIconSize,
};

export default RequestCoinIcon;
