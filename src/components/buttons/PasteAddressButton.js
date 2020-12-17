import React, { useCallback, useEffect, useState } from 'react';
import { Text } from '../text';
import MiniButton from './MiniButton';
import { checkIsValidAddressOrENS } from '@rainbow-me/helpers/validators';
import { useClipboard, useInvalidPaste } from '@rainbow-me/hooks';
import { deviceUtils } from '@rainbow-me/utils';

export default function PasteAddressButton({ onPress }) {
  const [isValid, setIsValid] = useState(false);
  const { onInvalidPaste } = useInvalidPaste();
  const {
    clipboard,
    enablePaste,
    getClipboard,
    hasClipboardData,
  } = useClipboard();

  useEffect(() => {
    async function validate() {
      const isValidAddress = await checkIsValidAddressOrENS(clipboard);
      setIsValid(isValidAddress);
    }

    if (!deviceUtils.isIOS14) {
      validate();
    }
  }, [clipboard]);

  const handlePress = useCallback(() => {
    if (!enablePaste) return;

    getClipboard(async clipboardData => {
      const isValidAddress = await checkIsValidAddressOrENS(clipboardData);

      if (isValidAddress) {
        return onPress?.(clipboardData);
      }

      return onInvalidPaste();
    });
  }, [enablePaste, getClipboard, onInvalidPaste, onPress]);

  return (
    <MiniButton
      disabled={deviceUtils.isIOS14 ? !hasClipboardData : clipboard && !isValid}
      onPress={handlePress}
      testID="paste-address-button"
      {...(android && { height: 30, overflowMargin: 15, width: 60 })}
    >
      <Text color="white" weight="bold">
        Paste
      </Text>
    </MiniButton>
  );
}
