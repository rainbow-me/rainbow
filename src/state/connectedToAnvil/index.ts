import { createBaseStore } from '@storesjs/stores';

export interface ConnectedToAnvilState {
  connectedToAnvil: boolean;
  setConnectedToAnvil: (connectedToAnvil: boolean) => void;

  connectedToAnvilOp: boolean;
  setConnectedToAnvilOp: (connectedToAnvilOp: boolean) => void;
}

export const useConnectedToAnvilStore = createBaseStore<ConnectedToAnvilState>(
  set => ({
    connectedToAnvil: false,
    setConnectedToAnvil: connectedToAnvil => {
      set({ connectedToAnvil });
    },

    connectedToAnvilOp: false,
    setConnectedToAnvilOp: connectedToAnvilOp => {
      set({ connectedToAnvilOp });
    },
  }),
  {
    storageKey: 'connectedToAnvil',
    version: 0,
  }
);
