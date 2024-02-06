import React, { useCallback } from 'react';
import { CircularProgress } from 'react-native-circular-progress';
import { useTheme } from '../../theme/ThemeContext';
import RequestVendorLogoIcon from './RequestVendorLogoIcon';
import styled from '@/styled-thing';

const RequestCoinIconSize = 48;

const ProgressBorder = styled(CircularProgress).attrs({
  childrenContainerStyle: {
    overflow: 'visible',
  },
  lineCap: 'round',
  rotation: 0,
  width: 2,
})({});

const RequestCoinIcon = ({ dappName, expirationColor, imageUrl, percentElapsed, size = RequestCoinIconSize }) => {
  const { colors } = useTheme();
  const renderIcon = useCallback(
    // react-native-circular-progress expects a single function child.
    () => <RequestVendorLogoIcon backgroundColor={colors.white} borderRadius={size} dappName={dappName} imageUrl={imageUrl} />,
    [colors.white, dappName, imageUrl, size]
  );

  return (
    <ProgressBorder fill={percentElapsed} prefill={percentElapsed} size={size} tintColor={expirationColor}>
      {renderIcon}
    </ProgressBorder>
  );
};

export default React.memo(RequestCoinIcon);
