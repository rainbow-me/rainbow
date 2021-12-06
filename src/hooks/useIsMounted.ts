import { useEffect, useRef } from 'react';

export default function useIsMounted() {
  const isMounted = useRef();

  useEffect(() => {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'undefined'.
    isMounted.current = true;
    return () => {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'undefined'... Remove this comment to see the full error message
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}
