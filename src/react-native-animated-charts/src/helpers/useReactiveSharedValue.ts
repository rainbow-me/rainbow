import { useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';

export default function useReactiveSharedValue(prop: any, name: any) {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const sharedValue = useSharedValue(null, name);
  if (sharedValue.value === null) {
    sharedValue.value = prop;
  }
  useEffect(() => {
    sharedValue.value = prop;
  }, [sharedValue, prop]);
  return sharedValue;
}
