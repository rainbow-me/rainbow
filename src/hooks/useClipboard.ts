import Clipboard from '@react-native-community/clipboard';
import { useCallback, useEffect, useState } from 'react';
import useAppState from './useAppState';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { deviceUtils } from '@rainbow-me/utils';

const listeners = new Set();

function setClipboard(content: any) {
  Clipboard.setString(content);
  // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  listeners.forEach(listener => listener(content));
}

export default function useClipboard() {
  const { justBecameActive } = useAppState();
  const [hasClipboardData, setHasClipboardData] = useState(false);
  const [clipboardData, updateClipboardData] = useState('');

  const checkClipboard = useCallback(
    () => Clipboard.hasString().then(setHasClipboardData),
    [setHasClipboardData]
  );

  const getClipboard = useCallback(
    callback =>
      Clipboard.getString().then(result => {
        updateClipboardData(result);
        callback?.(result);
      }),
    []
  );

  // Get initial clipboardData
  useEffect(() => {
    if (deviceUtils.isIOS14) {
      checkClipboard();
    } else {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
      getClipboard();
    }
  }, [checkClipboard, getClipboard]);

  // Get clipboardData when app just became foregrounded
  useEffect(() => {
    if (justBecameActive) {
      if (deviceUtils.isIOS14) {
        checkClipboard();
      } else {
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
    enablePaste: deviceUtils.isIOS14 ? hasClipboardData : !!clipboardData,
    getClipboard,
    hasClipboardData,
    setClipboard,
  };
}
