import create from 'zustand';
import { createStore } from '../internal/createStore';
import { RainbowTransaction } from '@/entities/transactions';
import { Network, ChainId } from '@/state/backendNetworks/types';
import { getBatchedProvider } from '@/handlers/web3';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { pendingTransactionsStore } from '@/state/pendingTransactions';
import { logger } from '@/logger';

type NonceData = {
  currentNonce?: number;
  latestConfirmedNonce?: number;
};

type GetNonceArgs = {
  address: string;
  chainId: ChainId;
};

type UpdateNonceArgs = NonceData & GetNonceArgs;

export async function getNextNonce({ address, chainId }: { address: string; chainId: ChainId }): Promise<number> {
  logger.info('[getNextNonce]: start', { address, chainId });

  const { getNonce } = nonceStore.getState();
  const localNonceData = getNonce({ address, chainId });
  const localNonce = localNonceData?.currentNonce ?? -1;

  const provider = getBatchedProvider({ chainId });
  const privateMempoolTimeout = 30 * 60_000;//useBackendNetworksStore.getState().getChainsPrivateMempoolTimeout()[chainId];

  logger.info('[getNextNonce]: local state', { localNonce, privateMempoolTimeout });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. Fetch on-chain transaction counts (pending vs latest)
  // ────────────────────────────────────────────────────────────────────────────
  const [pendingTxCountFromPublicRpc, latestTxCountFromPublicRpc] = await Promise.all([
    provider.getTransactionCount(address, 'pending'),
    provider.getTransactionCount(address, 'latest'),
  ]);

  const numPendingPublicTx = pendingTxCountFromPublicRpc - latestTxCountFromPublicRpc;
  const numPendingLocalTx = Math.max(localNonce + 1 - latestTxCountFromPublicRpc, 0);

  logger.info('[getNextNonce]: RPC counts', {
    pendingTxCountFromPublicRpc,
    latestTxCountFromPublicRpc,
    numPendingPublicTx,
    numPendingLocalTx,
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. Fast paths — no private mempool crossover
  // ────────────────────────────────────────────────────────────────────────────
  if (numPendingLocalTx === numPendingPublicTx) {
    logger.info('[getNextNonce]: no private mempool tx; proceeding', {
      nextNonce: pendingTxCountFromPublicRpc,
    });
    return pendingTxCountFromPublicRpc;
  }

  if (numPendingLocalTx === 0 && numPendingPublicTx > 0) {
    logger.info('[getNextNonce]: local behind public; catching up', {
      nextNonce: latestTxCountFromPublicRpc,
    });
    return latestTxCountFromPublicRpc;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. Inspect pending transactions for this address + chain
  // ────────────────────────────────────────────────────────────────────────────
  const { pendingTransactions: storePendingTransactions } = pendingTransactionsStore.getState();
  const pendingTransactions: RainbowTransaction[] = storePendingTransactions[address]?.filter(txn => txn.chainId === chainId) || [];

  logger.info('[getNextNonce]: inspecting pendingTransactions', {
    pendingCount: pendingTransactions.length,
  });

  let nextNonce = localNonce + 1;

  for (const pendingTx of pendingTransactions) {
    // Guard clauses
    if (!pendingTx.nonce || pendingTx.nonce < pendingTxCountFromPublicRpc) continue;
    if (!pendingTx.timestamp) continue;

    const ageMs = Date.now() - pendingTx.timestamp;

    logger.info('[getNextNonce]: evaluating pendingTx', {
      hash: pendingTx.hash,
      nonce: pendingTx.nonce,
      ageMs,
    });

    // Same nonce as public-pending
    if (pendingTx.nonce === pendingTxCountFromPublicRpc) {
      const isOlderThanTimeout = ageMs > privateMempoolTimeout;

      if (isOlderThanTimeout) {
        // Assume dropped — sync with public RPC
        nextNonce = pendingTxCountFromPublicRpc;
        logger.info('[getNextNonce]: assumed dropped; using public count', { nextNonce });
      } else {
        // Still alive — bump local once
        nextNonce = localNonce + 1;
        logger.info('[getNextNonce]: still pending; incrementing local', { nextNonce });
      }
      break;
    }

    // Gap detected — adopt public pending count
    nextNonce = pendingTxCountFromPublicRpc;
    logger.info('[getNextNonce]: nonce gap detected; using public count', { nextNonce });
    break;
  }

  logger.info('[getNextNonce]: final nextNonce', { nextNonce });
  return nextNonce;
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
      version: 2,
    },
  }
);

export const useNonceStore = create(nonceStore);
