import React from 'react';
import { HoldToAuthorizeButton } from '../buttons';
import { useColorForAsset } from '@rainbow-me/hooks';

export default function SendButton({
  assetAmount,
  isAuthorizing,
  isNft,
  isSufficientBalance,
  isSufficientGas,
  onLongPress,
  selected,
  testID,
  ...props
}) {
  const isZeroAssetAmount = Number(assetAmount) <= 0;

  const { colors, isDarkMode } = useTheme();
  const erc20Color = useColorForAsset(selected, undefined, false);
  const colorForAsset = isNft ? colors.appleBlue : erc20Color;

  const shadows = {
    colored: [
      [0, 10, 30, colors.shadow, 0.2],
      [0, 5, 15, isDarkMode ? colors.shadow : colorForAsset, 0.4],
    ],
    disabled: [
      [0, 10, 30, colors.shadow, 0.2],
      [0, 5, 15, isDarkMode ? colors.shadow : colorForAsset, 0.4],
    ],
  };

  let disabled = true;
  let label = 'Enter an Amount';

  if (!isZeroAssetAmount && !isSufficientGas) {
    disabled = true;
    label = 'Insufficient ETH';
  } else if (!isZeroAssetAmount && !isSufficientBalance) {
    disabled = true;
    label = 'Insufficient Funds';
  } else if (!isZeroAssetAmount) {
    disabled = false;
    label = 'Hold to Send';
  }

  return (
    <HoldToAuthorizeButton
      {...props}
      backgroundColor={colorForAsset}
      disabled={disabled}
      disabledBackgroundColor={colorForAsset}
      hideInnerBorder
      isAuthorizing={isAuthorizing}
      label={label}
      onLongPress={onLongPress}
      parentHorizontalPadding={19}
      shadows={disabled ? shadows.disabled : shadows.colored}
      showBiometryIcon={!disabled}
      testID={`${testID}-${label}`}
    />
  );
}
