import Clipboard from '@react-native-clipboard/clipboard';
import { useCallback, useEffect, useState } from 'react';
import useAppState from './useAppState';
import { deviceUtils } from '@/utils';

const listeners = new Set<React.Dispatch<React.SetStateAction<string>>>();

export function setClipboard(content: string) {
  Clipboard.setString(content);
  listeners.forEach(listener => listener(content));
}

export default function useClipboard() {
  const { justBecameActive } = useAppState();
  const [hasClipboardData, setHasClipboardData] = useState(false);
  const [clipboardData, updateClipboardData] = useState('');

  const checkClipboard = useCallback(() => Clipboard.hasString().then(setHasClipboardData), [setHasClipboardData]);

  const getClipboard = useCallback(
    (callback: (result: string) => void) =>
      Clipboard.getString().then((result: string) => {
        updateClipboardData(result);
        callback?.(result);
      }),
    []
  );

  // Get initial clipboardData
  useEffect(() => {
    if (deviceUtils.isIOS14) {
      checkClipboard();
    } else if (!deviceUtils.hasClipboardProtection) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
      getClipboard();
    }
  }, [checkClipboard, getClipboard]);

  // Get clipboardData when app just became foregrounded
  useEffect(() => {
    if (justBecameActive) {
      if (deviceUtils.isIOS14) {
        checkClipboard();
      } else if (!deviceUtils.hasClipboardProtection) {
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
        getClipboard();
      }
    }
  }, [checkClipboard, getClipboard, justBecameActive]);

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
    hasClipboardData,
    setClipboard,
  };
}
