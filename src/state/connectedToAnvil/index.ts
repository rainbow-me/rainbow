import { createRainbowStore } from '../internal/createRainbowStore';

export interface ConnectedToAnvilState {
  connectedToAnvil: boolean;
  setConnectedToAnvil: (connectedToAnvil: boolean) => void;

  connectedToAnvilOp: boolean;
  setConnectedToAnvilOp: (connectedToAnvilOp: boolean) => void;
}

export const useConnectedToAnvilStore = createRainbowStore<ConnectedToAnvilState>(
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
