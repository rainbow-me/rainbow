import { RainbowTransaction } from '@/entities/transactions';
import { getBatchedProvider } from '@/handlers/web3';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { Network, ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';

type NonceData = { currentNonce?: number; latestConfirmedNonce?: number };
type GetNonceArgs = { address: string; chainId: ChainId };

type UpdateNonceArgs = NonceData & GetNonceArgs;
type NoncesV0 = { [network in Network]: NonceData };
type Nonces = { [chainId in ChainId]: NonceData };

export type CurrentNonceState<T extends Nonces | NoncesV0> = {
  nonces: Record<string, T>;
  clearNonces: () => void;
  getNonce: ({ address, chainId }: GetNonceArgs) => NonceData | null;
  setNonce: ({ address, currentNonce, latestConfirmedNonce, chainId }: UpdateNonceArgs) => void;
};

const EMPTY_NONCES: Record<string, Nonces> = {};

export const useNonceStore = createRainbowStore<CurrentNonceState<Nonces>>(
  (set, get) => ({
    nonces: EMPTY_NONCES,

    clearNonces: () => set({ nonces: EMPTY_NONCES }),

    getNonce: ({ address, chainId }) => get().nonces[address]?.[chainId] ?? null,

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
  }),

  { storageKey: 'nonceStore' }
);

export const nonceActions = createStoreActions(useNonceStore);

export async function getNextNonce({ address, chainId }: { address: string; chainId: ChainId }): Promise<number> {
  const localNonceData = nonceActions.getNonce({ address, chainId });
  const localNonce = localNonceData?.currentNonce || -1;
  const provider = getBatchedProvider({ chainId });
  const privateMempoolTimeout = useBackendNetworksStore.getState().getChainsPrivateMempoolTimeout()[chainId];

  const [pendingTxCountFromPublicRpc, latestTxCountFromPublicRpc] = await Promise.all([
    provider.getTransactionCount(address, 'pending'),
    provider.getTransactionCount(address, 'latest'),
  ]);

  const numPendingPublicTx = pendingTxCountFromPublicRpc - latestTxCountFromPublicRpc;
  const numPendingLocalTx = Math.max(localNonce + 1 - latestTxCountFromPublicRpc, 0);
  if (numPendingLocalTx === numPendingPublicTx) return pendingTxCountFromPublicRpc; // nothing in private mempool, proceed normally
  if (numPendingLocalTx === 0 && numPendingPublicTx > 0) return latestTxCountFromPublicRpc; // catch up with public

  const { pendingTransactions: storePendingTransactions } = usePendingTransactionsStore.getState();
  const pendingTransactions: RainbowTransaction[] = storePendingTransactions[address]?.filter(txn => txn.chainId === chainId) || [];

  let nextNonce = localNonce + 1;
  for (const pendingTx of pendingTransactions) {
    if (!pendingTx.nonce || pendingTx.nonce < pendingTxCountFromPublicRpc) {
      continue;
    } else {
      if (!pendingTx.timestamp) continue;
      if (pendingTx.nonce === pendingTxCountFromPublicRpc) {
        if (Date.now() - pendingTx.timestamp > privateMempoolTimeout) {
          // if the pending txn is older than the private mempool timeout,
          // we assume it has been dropped and use the next available public pending tx count
          nextNonce = pendingTxCountFromPublicRpc;
          break;
        } else {
          nextNonce = localNonce + 1;
          break;
        }
      } else {
        nextNonce = pendingTxCountFromPublicRpc;
        break;
      }
    }
  }
  return nextNonce;
}
