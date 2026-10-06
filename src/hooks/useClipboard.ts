import { useCallback, useEffect, useState } from 'react';

import Clipboard from '@react-native-clipboard/clipboard';
import { useListen } from '@storesjs/stores';

import { useAppStateStore } from '@/state/appState/appStateStore';
import { deviceUtils } from '@/utils/deviceUtils';

const listeners = new Set<React.Dispatch<React.SetStateAction<string>>>();

export function setClipboard(content: string) {
  Clipboard.setString(content);
  listeners.forEach(listener => listener(content));
}

export default function useClipboard() {
  const [hasClipboardData, setHasClipboardData] = useState(false);
  const [clipboardData, updateClipboardData] = useState('');

  const getClipboard = useCallback(
    (callback?: (result: string) => void) =>
      Clipboard.getString().then((result: string) => {
        updateClipboardData(result);
        callback?.(result);
      }),
    []
  );

  useListen(
    useAppStateStore,
    s => s === 'active',
    isActive => {
      if (!isActive) return;
      if (deviceUtils.isIOS14) {
        Clipboard.hasString().then(setHasClipboardData);
      } else if (!deviceUtils.hasClipboardProtection) {
        getClipboard();
      }
    },
    { fireImmediately: true }
  );

  // Listen for updates
  useEffect(() => {
    listeners.add(updateClipboardData);
    return () => {
      listeners.delete(updateClipboardData);
    };
  }, []);

  return {
    clipboard: clipboardData,
    enablePaste: deviceUtils.isIOS14 ? hasClipboardData : deviceUtils.hasClipboardProtection || !!clipboardData,
    getClipboard,
    hasClipboardData: hasClipboardData || !!clipboardData,
    setClipboard,
  };
}
