import { useEffect, useState } from 'react';

export default function useFrameDelayedValue(value: any) {
  const [delayedValue, setDelayedValue] = useState(value);
  useEffect(() => {
    if (delayedValue !== value) {
      setTimeout(() => setDelayedValue(value), 5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return delayedValue;
}
