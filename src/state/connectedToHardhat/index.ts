import { createRainbowStore } from '../internal/createRainbowStore';

export interface ConnectedToHardhatState {
  connectedToHardhat: boolean;
  setConnectedToHardhat: (connectedToHardhat: boolean) => void;

  connectedToHardhatOp: boolean;
  setConnectedToHardhatOp: (connectedToHardhatOp: boolean) => void;
}

export const useConnectedToHardhatStore = createRainbowStore<ConnectedToHardhatState>(
  set => ({
    connectedToHardhat: false,
    setConnectedToHardhat: connectedToHardhat => {
      set({ connectedToHardhat });
    },

    connectedToHardhatOp: false,
    setConnectedToHardhatOp: connectedToHardhatOp => {
      set({ connectedToHardhatOp });
    },
  }),
  {
    storageKey: 'connectedToHardhat',
    version: 0,
  }
);
