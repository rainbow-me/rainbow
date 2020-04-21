import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { CircularProgress } from 'react-native-circular-progress';
import RequestVendorLogoIcon from './RequestVendorLogoIcon';

const RequestCoinIconSize = 48;

const sx = StyleSheet.create({
  childrenContainer: {
    overflow: 'visible',
  },
});

const RequestCoinIcon = ({
  dappName,
  expirationColor,
  percentElapsed,
  size,
}) => {
  const renderIcon = useCallback(
    () => <RequestVendorLogoIcon borderRadius={size} dappName={dappName} />,
    [dappName, size]
  );

  return (
    <CircularProgress
      childrenContainerStyle={sx.childrenContainer}
      fill={percentElapsed}
      lineCap="round"
      prefill={percentElapsed}
      rotation={0}
      size={size}
      tintColor={expirationColor}
      width={2}
    >
      {renderIcon}
    </CircularProgress>
  );
};

RequestCoinIcon.propTypes = {
  dappName: PropTypes.string,
  expirationColor: PropTypes.string,
  percentElapsed: PropTypes.number,
  size: PropTypes.number,
};

RequestCoinIcon.defaultProps = {
  size: RequestCoinIconSize,
};

export default React.memo(RequestCoinIcon);
