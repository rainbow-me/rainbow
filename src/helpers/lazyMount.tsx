import { useIsIdle } from '@/hooks/useIsIdle';
import React, { forwardRef, ReactNode } from 'react';

export const lazyMount = <C extends (props: Record<string, any>, ref?: any) => ReactNode>(Component: C): C => {
  return forwardRef(function LazyMountComponent(props, ref) {
    const idle = useIsIdle();

    if (!idle) {
      return null;
    }

    // @ts-expect-error its not worth the type work here
    return <Component ref={ref} {...props} />;
  }) as unknown as C;
};
