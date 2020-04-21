import Clipboard from '@react-native-community/clipboard';
import { useEffect, useState } from 'react';
import useAppState from './useAppState';

const listeners = new Set();

function setString(content) {
  Clipboard.setString(content);
  listeners.forEach(listener => listener(content));
}

export default function useClipboard() {
  const { justBecameActive } = useAppState();
  const [data, updateClipboardData] = useState('');

  function getClipboardData() {
    Clipboard.getString().then(updateClipboardData);
  }

  // Get initial data
  useEffect(() => getClipboardData(), []);

  // Get data when app just became foregrounded
  useEffect(() => {
    if (justBecameActive) {
      getClipboardData();
    }
  }, [justBecameActive]);

  // Listen for updates
  useEffect(() => {
    listeners.add(updateClipboardData);

    return () => {
      listeners.delete(updateClipboardData);
    };
  }, []);

  return {
    clipboard: data,
    setClipboard: setString,
  };
}
