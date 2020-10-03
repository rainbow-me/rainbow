import React, { useCallback, useEffect, useState } from 'react';
import { Text } from '../text';
import MiniButton from './MiniButton';
import { checkIsValidAddressOrENS } from '@rainbow-me/helpers/validators';
import { useClipboard, useInvalidPaste } from '@rainbow-me/hooks';
import { deviceUtils } from '@rainbow-me/utils';

export default function PasteAddressButton({ onPress }) {
  const [isValid, setIsValid] = useState(false);
  const { triggerInvalidPaste } = useInvalidPaste();
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

    validate();
  }, [clipboard]);

  const handlePress = useCallback(() => {
    if (!enablePaste) return;

    getClipboard(result => {
      if (isValid) {
        onPress?.(result);
      } else {
        triggerInvalidPaste();
      }
    });
  }, [enablePaste, getClipboard, isValid, onPress, triggerInvalidPaste]);

  return (
    <MiniButton
      disabled={deviceUtils.isIOS14 ? !hasClipboardData : clipboard && !isValid}
      onPress={handlePress}
      testID="paste-address-button"
    >
      <Text color="white" weight="semibold">
        Paste
      </Text>
    </MiniButton>
  );
}
