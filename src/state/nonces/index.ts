import create from 'zustand';
import { createStore } from '../internal/createStore';
import { RainbowTransaction } from '@/entities/transactions';
import { Network, ChainId } from '@/chains/types';
import { getBatchedProvider } from '@/handlers/web3';
import { chainsIdByName, chainsPrivateMempoolTimeout } from '@/chains';
import { pendingTransactionsStore } from '@/state/pendingTransactions';

type NonceData = {
  currentNonce?: number;
  latestConfirmedNonce?: number;
};

type GetNonceArgs = {
  address: string;
  chainId: ChainId;
};

type UpdateNonceArgs = NonceData & GetNonceArgs;

export async function getNextNonce({ address, chainId }: { address: string; chainId: ChainId }) {
  const { getNonce } = nonceStore.getState();
  const localNonceData = getNonce({ address, chainId });
  const localNonce = localNonceData?.currentNonce || 0;
  const provider = getBatchedProvider({ chainId });
  const privateMempoolTimeout = chainsPrivateMempoolTimeout[chainId];

  const pendingTxCountRequest = provider.getTransactionCount(address, 'pending');
  const latestTxCountRequest = provider.getTransactionCount(address, 'latest');
  const [pendingTxCountFromPublicRpc, latestTxCountFromPublicRpc] = await Promise.all([pendingTxCountRequest, latestTxCountRequest]);
  const numPendingPublicTx = pendingTxCountFromPublicRpc - latestTxCountFromPublicRpc;
  const numPendingLocalTx = localNonce - latestTxCountFromPublicRpc;
  if (numPendingLocalTx === numPendingPublicTx) return pendingTxCountFromPublicRpc; // nothing in private mempool, proceed normally
  if (numPendingLocalTx === 0 && numPendingPublicTx > 0) return latestTxCountFromPublicRpc; // catch up with public

  const { pendingTransactions: storePendingTransactions } = pendingTransactionsStore.getState();
  const pendingTransactions: RainbowTransaction[] = storePendingTransactions[address]?.filter(txn => txn.chainId === chainId) || [];

  for (const pendingTx of pendingTransactions) {
    if (!pendingTx.nonce || pendingTx.nonce < pendingTxCountFromPublicRpc) {
      continue;
    } else {
      if (!pendingTx.timestamp) continue;
      if (pendingTx.nonce === pendingTxCountFromPublicRpc) {
        if (Date.now() - pendingTx.timestamp > privateMempoolTimeout) {
          return pendingTxCountFromPublicRpc;
        } else {
          return localNonce + 1;
        }
      } else {
        return pendingTxCountFromPublicRpc;
      }
    }
  }
}

type NoncesV0 = {
  [network in Network]: NonceData;
};

type Nonces = {
  [chainId in ChainId]: NonceData;
};

export interface CurrentNonceState<T extends Nonces | NoncesV0> {
  nonces: Record<string, T>;
  setNonce: ({ address, currentNonce, latestConfirmedNonce, chainId }: UpdateNonceArgs) => void;
  getNonce: ({ address, chainId }: GetNonceArgs) => NonceData | null;
  clearNonces: () => void;
}

export const nonceStore = createStore<CurrentNonceState<Nonces>>(
  (set, get) => ({
    nonces: {},
    setNonce: ({ address, currentNonce, latestConfirmedNonce, chainId }) => {
      const { nonces: oldNonces } = get();
      const addressAndChainIdNonces = oldNonces?.[address]?.[chainId] || {};
      set({
        nonces: {
          ...oldNonces,
          [address]: {
            ...oldNonces[address],
            [chainId]: {
              currentNonce: currentNonce ?? addressAndChainIdNonces?.currentNonce,
              latestConfirmedNonce: latestConfirmedNonce ?? addressAndChainIdNonces?.latestConfirmedNonce,
            },
          },
        },
      });
    },
    getNonce: ({ address, chainId }) => {
      const { nonces } = get();
      return nonces[address]?.[chainId] ?? null;
    },
    clearNonces: () => {
      set({ nonces: {} });
    },
  }),
  {
    persist: {
      name: 'nonces',
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          const oldState = persistedState as CurrentNonceState<NoncesV0>;
          const newNonces: CurrentNonceState<Nonces>['nonces'] = {};
          for (const [address, networkNonces] of Object.entries(oldState.nonces)) {
            for (const [network, nonceData] of Object.entries(networkNonces)) {
              if (!newNonces[address]) {
                newNonces[address] = {} as Record<ChainId, NonceData>;
              }
              newNonces[address][chainsIdByName[network as Network]] = nonceData;
            }
          }
          return {
            ...oldState,
            nonces: newNonces,
          };
        }
        return persistedState as CurrentNonceState<Nonces>;
      },
    },
  }
);

export const useNonceStore = create(nonceStore);
