import { useCallback, useEffect, useState } from 'react';
import { Clipboard } from 'react-native';
import useAppState from './useAppState';

export default function useClipboard() {
  const { justBecameActive } = useAppState();
  const [data, updateClipboardData] = useState('');

  async function updateClipboard() {
    const content = await Clipboard.getString();
    updateClipboardData(content);
  }

  useEffect(() => {
    if (justBecameActive) {
      updateClipboard();
    }
  }, [justBecameActive]);

  const setString = useCallback(content => {
    Clipboard.setString(content);
    updateClipboardData(content);
  }, []);

  return {
    clipboard: data,
    setClipboard: setString,
  };
}
