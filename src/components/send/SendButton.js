import lang from 'i18n-js';
import React from 'react';
import { HoldToAuthorizeButton } from '../buttons';

export default function SendButton({
  backgroundColor,
  disabled,
  isAuthorizing,
  isNft,
  onLongPress,
  testID,
  ...props
}) {
  const { colors, isDarkMode } = useTheme();
  const colorForAsset = isNft ? colors.appleBlue : backgroundColor;

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

  return (
    <HoldToAuthorizeButton
      {...props}
      backgroundColor={colorForAsset}
      disabled={disabled}
      disabledBackgroundColor={colorForAsset}
      hideInnerBorder
      isAuthorizing={isAuthorizing}
      label={
        disabled
          ? `􀄨 ${lang.t('wallet.transaction.complete_checks')}`
          : lang.t('button.hold_to_send')
      }
      onLongPress={onLongPress}
      parentHorizontalPadding={19}
      shadows={disabled ? shadows.disabled : shadows.colored}
      showBiometryIcon={!disabled}
      testID={testID}
    />
  );
}
