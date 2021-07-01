import React from 'react';
import { HoldToAuthorizeButton } from '../buttons';

export default function SendButton({
  disabled,
  isAuthorizing,
  onLongPress,
  testID,
  ...props
}) {
  return (
    <HoldToAuthorizeButton
      {...props}
      disabled={disabled}
      isAuthorizing={isAuthorizing}
      label={disabled ? 'Complete checks' : 'Hold to Send'}
      onLongPress={onLongPress}
      parentHorizontalPadding={15}
      showBiometryIcon={!disabled}
      testID={testID}
    />
  );
}
