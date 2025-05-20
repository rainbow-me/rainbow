import create from 'zustand';
import { createStore } from '../internal/createStore';
import { Network, ChainId } from '@/state/backendNetworks/types';
import { getBatchedProvider, getProvider } from '@/handlers/web3';
import { pendingTransactionsStore } from '@/state/pendingTransactions';
import { logger } from '@/logger';
import { RainbowTransaction } from '../../entities';

type NonceData = {
  currentNonce?: number;
  latestConfirmedNonce?: number;
};

type GetNonceArgs = {
  address: string;
  chainId: ChainId;
};

type UpdateNonceArgs = NonceData & GetNonceArgs;

/**
 * This helper watches the hashes after nonce is called ongoing, for debugging:
 */
interface HashEntry {
  chainId: ChainId;
  status: 'PENDING' | 'DROPPED' | 'MINED' | 'UNKNOWN';
}
const __hashWatch: Record<string, HashEntry> = {};
export function getHashWatchList() {
  return __hashWatch;
}
export function trackHash(hash: string, chainId: ChainId) {
  if (__hashWatch[hash]) return; // already watching
  __hashWatch[hash] = { chainId, status: 'UNKNOWN' };
  logger.info(`[HashWatch] Now tracking ${hash.slice(0, 10)}… on chain ${chainId}`);
}
setInterval(async () => {
  const entries = Object.entries(__hashWatch);
  if (!entries.length) return;
  for (const [hash, { chainId, status: prev }] of entries) {
    const provider = getProvider({ chainId });
    let next: HashEntry['status'] = prev;
    try {
      const tx = await provider.getTransaction(hash);
      if (!tx) next = 'DROPPED';
      else if (tx.blockNumber) next = 'MINED';
      else next = 'PENDING';
    } catch {
      next = 'UNKNOWN';
    }
    if (next !== prev) {
      __hashWatch[hash].status = next;
      logger.info(`[HashWatch] ${hash.slice(0, 10)}… → ${next}`);
    }
  }
}, 30_000); // poll every 30 s

type Snapshot = {
  ts: string;
  address: string;
  chainId: ChainId;
  localNonce: number;
  pendingRPC: number;
  latestRPC: number;
  decided: number;
  comment: string;
};
const __nonceDebugHistory: Snapshot[] = [];
export function getNonceDebugHistory() {
  return __nonceDebugHistory;
}
const short = (addr: string) => addr.slice(0, 6) + '…' + addr.slice(-4);

export async function getNextNonce({ address, chainId }: { address: string; chainId: ChainId }): Promise<number> {
  const stamp = () => new Date().toISOString().split('T')[1].split('Z')[0];
  const { getNonce } = nonceStore.getState();
  const localNonce = getNonce({ address, chainId })?.currentNonce ?? -1;

  const provider = getBatchedProvider({ chainId });
  const [pendingRPC, latestRPC] = await Promise.all([
    provider.getTransactionCount(address, 'pending'),
    provider.getTransactionCount(address, 'latest'),
  ]);
  const numPendingPublic = pendingRPC - latestRPC;
  const numPendingLocal = Math.max(localNonce + 1 - latestRPC, 0);

  // helper to emit + auto-track hash for the *decided* nonce if present
  function done(comment: string, decided: number) {
    const snap: Snapshot = {
      ts: stamp(),
      address: short(address),
      chainId,
      localNonce,
      pendingRPC,
      latestRPC,
      decided,
      comment,
    };
    __nonceDebugHistory.push(snap);
    logger.info(`[NonceDebug] ${comment}`, snap);

    // try to find a tx we just created with this nonce & start watching it
    const store = pendingTransactionsStore.getState().pendingTransactions;
    const txSameNonce: RainbowTransaction | undefined = store[address]?.find(t => t.chainId === chainId && t.nonce === decided);
    if (txSameNonce?.hash) trackHash(txSameNonce.hash, chainId);

    return decided;
  }

  // ── Fast exit paths ──────────────────────────────────────────────────────
  if (numPendingLocal === numPendingPublic) {
    return done('No private mempool tx – use RPC pending.', pendingRPC);
  }
  if (numPendingLocal === 0 && numPendingPublic > 0) {
    return done('Local behind – sync to RPC latest.', latestRPC);
  }

  // ── Inspect Rainbow-tracked pending txs ──────────────────────────────────
  const tracked = pendingTransactionsStore.getState().pendingTransactions[address]?.filter(t => t.chainId === chainId) || [];
  let nextNonce = localNonce + 1;
  let note = 'Default bump local +1.';
  for (const tx of tracked) {
    if (!tx.nonce || tx.nonce < pendingRPC || !tx.timestamp) continue;
    const age = Date.now() - tx.timestamp;
    const timeout = 30 * 60_000; // 30-min test value
    if (tx.nonce === pendingRPC) {
      if (age > timeout) {
        nextNonce = pendingRPC;
        note = `Tracked nonce ${tx.nonce} >30m old — assume dropped.`;
      } else {
        nextNonce = localNonce + 1;
        note = `Tracked nonce ${tx.nonce} still fresh — keep bumping.`;
      }
      break;
    }
    nextNonce = pendingRPC;
    note = `Gap ahead of RPC — adopt RPC pending ${pendingRPC}.`;
    break;
  }
  return done(note, nextNonce);
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
