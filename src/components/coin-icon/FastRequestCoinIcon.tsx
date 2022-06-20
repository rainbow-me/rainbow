import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
// @ts-ignore
import { CircularProgress } from 'react-native-circular-progress';
import FastRequestVendorLogoIcon from './FastRequestVendorLogoIcon';
import { ThemeContextProps } from '@rainbow-me/theme';

const RequestCoinIconSize = 48;

const cx = StyleSheet.create({
  circularProgress: {
    overflow: 'visible',
  },
});

const RequestCoinIcon = ({
  dappName,
  expirationColor,
  imageUrl,
  percentElapsed,
  size = RequestCoinIconSize,
  theme,
}: {
  dappName: string;
  expirationColor: string;
  imageUrl: string;
  percentElapsed: number;
  size?: number;
  theme: ThemeContextProps;
}) => {
  const { colors } = theme;
  const renderIcon = useCallback(
    // react-native-circular-progress expects a single function child.
    () => (
      <FastRequestVendorLogoIcon
        backgroundColor={colors.white}
        borderRadius={size}
        dappName={dappName}
        imageUrl={imageUrl}
      />
    ),
    [colors.white, dappName, imageUrl, size]
  );

  return (
    <CircularProgress
      childrenContainerStyle={cx.circularProgress}
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

export default React.memo(RequestCoinIcon);
