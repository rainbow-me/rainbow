import React, { useCallback } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-circular-progress"' has no e... Remove this comment to see the full error message
import { CircularProgress } from 'react-native-circular-progress';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module './RequestVendorLogoIcon' was resolved to '... Remove this comment to see the full error message
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
  imageUrl,
  percentElapsed,
  size = RequestCoinIconSize,
}: any) => {
  const { colors } = useTheme();
  const renderIcon = useCallback(
    // react-native-circular-progress expects a single function child.
    () => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <RequestVendorLogoIcon
        backgroundColor={colors.white}
        borderRadius={size}
        dappName={dappName}
        imageUrl={imageUrl}
      />
    ),
    [colors.white, dappName, imageUrl, size]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
