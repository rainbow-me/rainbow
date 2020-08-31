import { useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useSharedValue } from 'react-native-reanimated';

export default function useReactiveSharedValue(prop, name) {
  const sharedValue = useSharedValue(prop, name);
  useEffect(() => {
    sharedValue.value = prop;
  }, [sharedValue, prop]);
  return sharedValue;
}
