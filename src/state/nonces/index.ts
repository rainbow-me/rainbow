import create from 'zustand';
import { createStore } from '../internal/createStore';
import { Network } from '@/networks/types';
import { getProviderForNetwork } from '@/handlers/web3';

type NonceData = {
  currentNonce?: number;
  latestConfirmedNonce?: number;
};

type GetNonceArgs = {
  address: string;
  network: Network;
};

type UpdateNonceArgs = NonceData & GetNonceArgs;

export async function getNextNonce({ address, network }: { address: string; network: Network }) {
  const { getNonce } = nonceStore.getState();
  const localNonceData = getNonce({ address, network });
  const localNonce = localNonceData?.currentNonce || 0;
  const provider = getProviderForNetwork(network);
  const txCountIncludingPending = await provider.getTransactionCount(address, 'pending');
  if (!localNonce && !txCountIncludingPending) return 0;
  const ret = Math.max(localNonce + 1, txCountIncludingPending);
  return ret;
}

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
