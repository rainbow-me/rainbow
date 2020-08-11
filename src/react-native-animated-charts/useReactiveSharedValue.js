import { useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';

export default function useReactiveSharedValue(prop) {
  const sharedValue = useSharedValue(prop);
  useEffect(() => {
    sharedValue.value = prop;
  }, [sharedValue, prop]);
  return sharedValue;
}
