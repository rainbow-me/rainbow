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
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <HoldToAuthorizeButton
      {...props}
      backgroundColor={colorForAsset}
      disabled={disabled}
      disabledBackgroundColor={colorForAsset}
      hideInnerBorder
      isAuthorizing={isAuthorizing}
      label={disabled ? '􀄨 Complete checks' : 'Hold to Send'}
      onLongPress={onLongPress}
      parentHorizontalPadding={19}
      shadows={disabled ? shadows.disabled : shadows.colored}
      showBiometryIcon={!disabled}
      testID={testID}
    />
  );
}
