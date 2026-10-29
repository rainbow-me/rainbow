import { createBaseStore, type BaseStore } from '@storesjs/stores';

import { useStableValue } from '@/hooks/useStableValue';

/**
 * Creates a stable, component-local store initialized with the provided value.
 */
export function useStore<T>(initialState: T): BaseStore<T> {
  return useStableValue(() => createBaseStore(() => initialState));
}
