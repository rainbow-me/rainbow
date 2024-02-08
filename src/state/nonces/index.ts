import create from 'zustand';
import { createStore } from '../internal/createStore';
import { Network } from '@/networks/types';

type NonceData = {
  currentNonce?: number;
  latestConfirmedNonce?: number;
};

type GetNonceArgs = {
  address: string;
  network: Network;
};

type UpdateNonceArgs = NonceData & GetNonceArgs;

export interface CurrentNonceState {
  nonces: Record<string, Record<Network, NonceData>>;
  setNonce: ({ address, currentNonce, latestConfirmedNonce, network }: UpdateNonceArgs) => void;
  getNonce: ({ address, network }: GetNonceArgs) => NonceData | null;
  clearNonces: () => void;
}

export const nonceStore = createStore<CurrentNonceState>(
  (set, get) => ({
    nonces: {},
    setNonce: ({ address, currentNonce, latestConfirmedNonce, network }) => {
      const { nonces: oldNonces } = get();
      const addressAndChainIdNonces = oldNonces?.[address]?.[network] || {};
      set({
        nonces: {
          ...oldNonces,
          [address]: {
            ...oldNonces[address],
            [network]: {
              currentNonce: currentNonce ?? addressAndChainIdNonces?.currentNonce,
              latestConfirmedNonce: latestConfirmedNonce ?? addressAndChainIdNonces?.latestConfirmedNonce,
            },
          },
        },
      });
    },
    getNonce: ({ address, network }) => {
      const { nonces } = get();
      return nonces[address]?.[network] ?? null;
    },
    clearNonces: () => {
      set({ nonces: {} });
    },
  }),
  {
    persist: {
      name: 'nonces',
      version: 0,
    },
  }
);

export const useNonceStore = create(nonceStore);
