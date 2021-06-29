import React, { useCallback, useEffect, useState } from 'react';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
import { useClipboard, useInvalidPaste } from '@rainbow-me/hooks';
import { deviceUtils } from '@rainbow-me/utils';

export default function PasteAddressButton({ onPress }) {
  const [isValid, setIsValid] = useState(false);
  const { colors } = useTheme();
  const { onInvalidPaste } = useInvalidPaste();
  const {
    clipboard,
    enablePaste,
    getClipboard,
    hasClipboardData,
  } = useClipboard();

  useEffect(() => {
    async function validate() {
      const isValidAddress = await checkIsValidAddressOrDomain(clipboard);
      setIsValid(isValidAddress);
    }

    if (!deviceUtils.isIOS14) {
      validate();
    }
  }, [clipboard]);

  const handlePress = useCallback(() => {
    if (!enablePaste) return;

    getClipboard(async clipboardData => {
      const isValidAddress = await checkIsValidAddressOrDomain(clipboardData);

      if (isValidAddress) {
        return onPress?.(clipboardData);
      }

      return onInvalidPaste();
    });
  }, [enablePaste, getClipboard, onInvalidPaste, onPress]);

  return (
    <ButtonPressAnimation
      disabled={deviceUtils.isIOS14 ? !hasClipboardData : clipboard && !isValid}
      onPress={handlePress}
      testID="paste-address-button"
    >
      <Text align="right" color={colors.appleBlue} size="large" weight="heavy">
        􀜍 Paste
      </Text>
    </ButtonPressAnimation>
  );
}
