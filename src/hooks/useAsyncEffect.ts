import { useEffect } from 'react';

export default function useAsyncEffect(
  fn: () => Promise<unknown>,
  deps: unknown[] = []
) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
