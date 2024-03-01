import { useCallback, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

export default function useHeight(defaultHeight = 0) {
  const [height, setHeight] = useState(defaultHeight);

  const onHeight = useCallback(({ nativeEvent }: LayoutChangeEvent) => setHeight(nativeEvent?.layout?.height), []);

  return [height, onHeight];
}
