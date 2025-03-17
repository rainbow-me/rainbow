import React from 'react';
import { useComponentLoadTime } from './useComponentLoadTime';

export function withPerformanceTracking<P extends object>(Component: React.ComponentType<P>, componentName?: string) {
  const name = componentName || Component.displayName || Component.name || 'UnknownComponent';

  const WithPerformanceTracking = (props: P) => {
    useComponentLoadTime(name);
    return <Component {...props} />;
  };

  WithPerformanceTracking.displayName = `WithPerformanceTracking(${name})`;

  return WithPerformanceTracking;
}
