import { useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';

export default function useReactiveSharedValue(prop, name) {
  const sharedValue = useSharedValue(null, name);
  if (sharedValue.value === null) {
    sharedValue.value = prop;
  }
  useEffect(() => {
    sharedValue.value = prop;
  }, [sharedValue, prop]);
  return sharedValue;
}
