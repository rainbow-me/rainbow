import React, { useCallback } from 'react';
import { checkIsValidAddressOrENS } from '../../helpers/validators';
import { Text } from '../text';
import MiniButton from './MiniButton';
import { useClipboard } from '@rainbow-me/hooks';

export default function PasteAddressButton({ onPress }) {
  const { clipboard } = useClipboard();

  const handlePress = useCallback(async () => {
    const isValidAddress = await checkIsValidAddressOrENS(clipboard);
    if (isValidAddress && onPress) {
      onPress(clipboard);
    }
  }, [clipboard, onPress]);

  return (
    <MiniButton disabled={!clipboard} onPress={handlePress}>
      <Text color="white" weight="semibold">
        Paste
      </Text>
    </MiniButton>
  );
}
