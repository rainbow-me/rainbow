import { useCallback, useState } from 'react';

export default function useHeight(defaultHeight = 0) {
  const [height, setHeight] = useState(defaultHeight);

  const onHeight = useCallback(
    ({ nativeEvent }) => setHeight(nativeEvent?.layout?.height),
    []
  );

  return [height, onHeight];
}
