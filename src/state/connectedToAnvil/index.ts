import { createBaseStore } from '@storesjs/stores';

export interface ConnectedToAnvilState {
  connectedToAnvil: boolean;
  setConnectedToAnvil: (connectedToAnvil: boolean) => void;
}

export const useConnectedToAnvilStore = createBaseStore<ConnectedToAnvilState>(
  set => ({
    connectedToAnvil: false,
    setConnectedToAnvil: connectedToAnvil => {
      set({ connectedToAnvil });
    },
  }),
  {
    storageKey: 'connectedToAnvil',
    version: 0,
  }
);
