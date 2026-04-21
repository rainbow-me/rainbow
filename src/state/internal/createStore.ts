import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware';
import { createStore as createVanillaStore, type Mutate, type StoreApi } from 'zustand/vanilla';

import { persistStorage } from './persistStorage';

type Initializer<TState> = Parameters<typeof persist<TState>>[0];
export type StoreWithPersist<TState> = Mutate<StoreApi<TState>, [['zustand/persist', unknown]]> & {
  initializer: Initializer<TState>;
};

/**
 * @deprecated This is a legacy store creator. Use `createRainbowStore` instead.
 */
export function createStore<TState>(
  initializer: Initializer<TState>,
  { persist: persistOptions }: { persist?: PersistOptions<TState> } = {}
) {
  const name = `rainbow.zustand.${persistOptions?.name}`;
  return Object.assign(
    createVanillaStore(
      persist(initializer, {
        ...persistOptions,
        name,
        storage: createJSONStorage(() => persistStorage),
      })
    ),
    { initializer }
  );
}
