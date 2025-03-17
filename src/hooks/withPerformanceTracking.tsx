import React from 'react';
import { useComponentLoadTime } from './useComponentLoadTime';
import { IS_DEV } from '@/env';

export function withPerformanceTracking<P extends object>(Component: React.ComponentType<P>, componentName?: string) {
  const name = componentName || Component.displayName || Component.name || 'UnknownComponent';

  const WithPerformanceTracking = (props: P) => {
    useComponentLoadTime(name);
    return <Component {...props} />;
  };

  WithPerformanceTracking.displayName = `${name}`;

  return IS_DEV ? WithPerformanceTracking : Component;
}
