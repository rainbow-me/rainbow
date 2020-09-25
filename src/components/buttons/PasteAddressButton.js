import React, { useCallback, useEffect, useState } from 'react';
import { checkIsValidAddressOrENS } from '../../helpers/validators';
import { Text } from '../text';
import MiniButton from './MiniButton';
import { useClipboard } from '@rainbow-me/hooks';

export default function PasteAddressButton({ onPress }) {
  const { clipboard } = useClipboard();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validate() {
      const isValidAddress = await checkIsValidAddressOrENS(clipboard);
      setIsValid(isValidAddress);
    }

    validate();
  }, [clipboard]);

  const handlePress = useCallback(() => {
    if (isValid) {
      onPress?.(clipboard);
    }
  }, [clipboard, isValid, onPress]);

  return (
    <MiniButton
      disabled={!isValid}
      onPress={handlePress}
      testID="paste-address-button"
    >
      <Text color="white" weight="semibold">
        Paste
      </Text>
    </MiniButton>
  );
}
