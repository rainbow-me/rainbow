// https://github.com/TanStack/query/blob/main/packages/react-query-persist-client/src/PersistQueryClientProvider.tsx

import * as React from 'react';

import { persistQueryClient, PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { QueryClientProvider, QueryClientProviderProps, IsRestoringProvider } from '@tanstack/react-query';

export type PersistQueryClientProviderProps = QueryClientProviderProps & {
  persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>;
  onSuccess?: () => void;
};

export const PersistQueryClientProvider = ({
  client,
  children,
  persistOptions,
  onSuccess,
  ...props
}: PersistQueryClientProviderProps): JSX.Element => {
  const [isRestoring, setIsRestoring] = React.useState(true);
  const refs = React.useRef({ persistOptions, onSuccess });

  React.useEffect(() => {
    refs.current = { persistOptions, onSuccess };
  });

  React.useEffect(() => {
    let isStale = false;
    setIsRestoring(true);
    const [unsubscribe, promise] = persistQueryClient({
      ...refs.current.persistOptions,
      queryClient: client,
    });

    promise.then(() => {
      if (!isStale) {
        refs.current.onSuccess?.();
        setIsRestoring(false);
      }
    });

    return () => {
      isStale = true;
      unsubscribe();
    };
  }, [client]);

  return (
    <QueryClientProvider client={client} {...props}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  );
};
