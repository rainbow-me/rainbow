import { persist } from 'zustand/middleware';
import create, { Mutate, StoreApi } from 'zustand/vanilla';

import { persistStorage } from './persistStorage';

type Initializer<TState> = Parameters<typeof persist<TState>>[0];
export type StoreWithPersist<TState> = Mutate<
  StoreApi<TState>,
  [['zustand/persist', unknown]]
> & {
  initializer: Initializer<TState>;
};

export function createStore<TState>(
  initializer: Initializer<TState>
) {
  const name = `rainbow.zustand`;
  return Object.assign(
    create(
      persist(initializer, {
        name,
        getStorage: () => (persistStorage),
      }),
    ),
    { initializer },
  );
}
