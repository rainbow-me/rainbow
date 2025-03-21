import { useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';

export default function useReactiveSharedValue<T>(prop: T) {
  const sharedValue = useSharedValue<T | null>(null);
  if (sharedValue.value === null) {
    sharedValue.value = prop;
  }
  useEffect(() => {
    sharedValue.value = prop;
  }, [sharedValue, prop]);
  return sharedValue;
}
