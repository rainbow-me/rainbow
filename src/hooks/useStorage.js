import AsyncStorage from '@react-native-community/async-storage';
import { useEffect, useState } from 'react';

export default function useAsyncStorage(key, defaultValue) {
  const [state, setState] = useState({
    hydrated: false,
    storageValue: defaultValue,
  });

  const { hydrated, storageValue } = state;

  async function pullFromStorage() {
    const fromStorage = await AsyncStorage.getItem(key);
    let value = defaultValue;
    if (fromStorage) {
      value = JSON.parse(fromStorage);
    }
    setState({ hydrated: true, storageValue: value });
  }

  async function updateStorage(newValue) {
    setState({ hydrated: true, storageValue: newValue });
    const stringifiedValue = JSON.stringify(newValue);
    await AsyncStorage.setItem(key, stringifiedValue);
  }

  useEffect(() => {
    pullFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [storageValue, updateStorage, hydrated];
}
