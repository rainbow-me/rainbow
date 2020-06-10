import React, { useCallback } from 'react';
import { CircularProgress } from 'react-native-circular-progress';
import styled from 'styled-components/primitives';
import RequestVendorLogoIcon from './RequestVendorLogoIcon';

const RequestCoinIconSize = 48;

const ProgressBorder = styled(CircularProgress).attrs({
  childrenContainerStyle: {
    overflow: 'visible',
  },
  lineCap: 'round',
  rotation: 0,
  width: 2,
})``;

const RequestCoinIcon = ({
  dappName,
  expirationColor,
  percentElapsed,
  size = RequestCoinIconSize,
}) => {
  const renderIcon = useCallback(
    // react-native-circular-progress expects a single function child.
    () => <RequestVendorLogoIcon borderRadius={size} dappName={dappName} />,
    [dappName, size]
  );

  return (
    <ProgressBorder
      fill={percentElapsed}
      prefill={percentElapsed}
      size={size}
      tintColor={expirationColor}
    >
      {renderIcon}
    </ProgressBorder>
  );
};

export default React.memo(RequestCoinIcon);
