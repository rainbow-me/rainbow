import { base64 } from '@scure/base';

import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { RainbowError } from '@/logger';

import { type SolanaAddress } from '../address';
import { requireSolanaBlockhash, type SolanaBlockhash } from '../core/transaction/blockhash';
import { requireSolanaTransactionSignature, type SolanaTransactionSignature } from '../core/transaction/signature';

/**
 * The clusters this client can address.
 *
 * **Neither endpoint is a Rainbow endpoint, and that is the finding rather than an
 * oversight.** No Rainbow endpoint currently serves Solana RPC to the app, so what is
 * reachable today is the ecosystem's public keyless endpoints, which is what these are.
 * Routing this traffic through Rainbow infrastructure instead is a decision this work
 * recommends rather than takes.
 *
 * Broadcasting to Solana mainnet is separately out of scope for this work, because a
 * mainnet broadcast spends. That bound is on what gets run, not on what this type can
 * express; nothing in the app calls this module yet.
 */
export type SolanaCluster = 'devnet' | 'mainnet';

const SOLANA_CLUSTER_ENDPOINTS: Record<SolanaCluster, string> = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
};

/**
 * How much of a transaction's fate the cluster will admit to.
 *
 * `err` is `unknown` on purpose. It is a tagged union of every program error the
 * runtime can produce, and narrowing it here would either be a lie or a transcription
 * of the whole `TransactionError` enum. What a caller needs is whether it is null.
 */
export type SolanaSignatureStatus = {
  readonly slot: number;
  readonly confirmations: number | null;
  readonly confirmationStatus: 'processed' | 'confirmed' | 'finalized' | null;
  readonly err: unknown;
};

export type SolanaPrioritizationFee = {
  readonly slot: number;
  readonly prioritizationFeeMicroLamports: bigint;
};

export type SolanaBlockhashResponse = {
  readonly blockhash: SolanaBlockhash;
  /**
   * The last block height at which this blockhash is still accepted. The window is
   * exactly 150 blocks, agreeing between the SDK constant and a live devnet
   * measurement, and it is a block height rather than a slot: skipped slots do not
   * consume it.
   */
  readonly lastValidBlockHeight: number;
};

/**
 * The Solana transport.
 *
 * `requestAirdrop` is deliberately absent. It is devnet-only and it is a write rather
 * than a read, so it belongs to an exercise harness; on this interface its presence
 * would be an invitation.
 */
export type SolanaRpcClient = {
  /**
   * Where this client sends. Carried on the interface because an unverifiable outcome
   * has to name it: a transaction signature is not a fact on its own, it is a fact
   * about one cluster, and "we submitted this and cannot tell you what happened" is
   * useless without saying where to go and look.
   */
  readonly endpoint: string;
  getLatestBlockhash(): Promise<SolanaBlockhashResponse>;
  getBlockHeight(): Promise<number>;
  /**
   * `skipPreflight` exists on this signature because a **resend** needs it, and that is
   * not a preference. Preflight simulates against the current bank, so resending
   * byte-identical bytes for a transaction the cluster has already processed fails
   * simulation with `AlreadyProcessed` and the call throws rather than returning the
   * signature. The retry rule is to resend those exact bytes, so the rule and a
   * mandatory preflight are incompatible; the first send keeps preflight and a resend
   * skips it.
   */
  sendTransaction(signedBytes: Uint8Array, options?: { readonly skipPreflight?: boolean }): Promise<SolanaTransactionSignature>;
  /**
   * `searchTransactionHistory` defaults to false because the common case is polling a
   * transaction that is still recent, and searching history is the expensive path. It has
   * to be reachable, though: the status cache evicts, so a poll resumed after a gap sees
   * `null` for a transaction that actually landed, and concluding from that alone is how a
   * landed transfer gets reported as never having landed.
   */
  getSignatureStatuses(
    signatures: readonly SolanaTransactionSignature[],
    options?: { readonly searchTransactionHistory?: boolean }
  ): Promise<readonly (SolanaSignatureStatus | null)[]>;
  getBalance(address: SolanaAddress): Promise<bigint>;
  getRecentPrioritizationFees(addresses: readonly SolanaAddress[]): Promise<readonly SolanaPrioritizationFee[]>;
  getMinimumBalanceForRentExemption(dataLength: number): Promise<bigint>;
  /**
   * The fee the cluster will actually charge for this compiled message, or null if the
   * message's blockhash has already expired.
   *
   * Preferred over `solanaTransactionFeeLamports` for anything shown to a user: the
   * arithmetic is a model of the fee schedule and this is the fee.
   */
  getFeeForMessage(messageBytes: Uint8Array): Promise<bigint | null>;
};

type JsonRpcResponse<T> = {
  result?: T;
  error?: { code: number; message: string };
};

/**
 * Wraps one JSON-RPC call.
 *
 * A JSON-RPC error arrives with HTTP 200 and an `error` member, so a caller that only
 * checks transport status sees every refusal as a success carrying `undefined`. That is
 * the failure shape this function exists to close, and a probe of the public devnet
 * faucet is the worked example: the faucet answered one request with
 * `{"code":-32603,"message":"Internal error"}` at HTTP 200 and the rest with HTTP 429.
 */
async function call<T>(client: Pick<RainbowFetchClient, 'post'>, method: string, params: unknown[]): Promise<T> {
  const { data } = await client.post<JsonRpcResponse<T>>('', { jsonrpc: '2.0', id: 1, method, params });

  if (data?.error) {
    throw new RainbowError(`[solana/rpc]: ${method} failed with ${data.error.code}: ${data.error.message}`);
  }
  if (data?.result === undefined) {
    throw new RainbowError(`[solana/rpc]: ${method} returned neither a result nor an error`);
  }

  return data.result;
}

/**
 * Converts an RPC number to a bigint without going through a lossy float.
 *
 * Lamport quantities are u64 and the JSON parse has already produced a JavaScript
 * number, so anything above 2^53 has already lost precision by the time it arrives.
 * This throws on a non-integer rather than truncating, so the loss is visible instead of
 * silent. A full fix needs a custom JSON parse, which is a cost worth paying only when
 * a real balance exceeds 9,007,199 SOL.
 */
function toLamports(value: unknown, method: string): bigint {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new RainbowError(`[solana/rpc]: ${method} returned a non-integer lamport amount`);
  }
  return BigInt(value);
}

/**
 * Builds a client against an explicit endpoint.
 *
 * Exported separately from `getSolanaConnection` so a test or an exercise harness can
 * point the real client at a local validator, which is how the send route was exercised
 * end to end without depending on a third-party faucet.
 */
export function createSolanaRpcClient(args: {
  readonly endpoint: string;
  readonly client?: Pick<RainbowFetchClient, 'post'>;
}): SolanaRpcClient {
  const client = args.client ?? new RainbowFetchClient({ baseURL: args.endpoint });

  return {
    endpoint: args.endpoint,

    async getLatestBlockhash() {
      const result = await call<{ value?: { blockhash?: string; lastValidBlockHeight?: number } }>(client, 'getLatestBlockhash', [
        { commitment: 'confirmed' },
      ]);

      const lastValidBlockHeight = result.value?.lastValidBlockHeight;
      if (typeof lastValidBlockHeight !== 'number') {
        throw new RainbowError('[solana/rpc]: getLatestBlockhash returned no lastValidBlockHeight');
      }

      return {
        blockhash: requireSolanaBlockhash(result.value?.blockhash, '[solana/rpc]: getLatestBlockhash returned a malformed blockhash'),
        lastValidBlockHeight,
      };
    },

    async getBlockHeight() {
      return call<number>(client, 'getBlockHeight', [{ commitment: 'confirmed' }]);
    },

    async sendTransaction(signedBytes, options) {
      const result = await call<string>(client, 'sendTransaction', [
        base64.encode(signedBytes),
        // On a first send `skipPreflight: false` keeps the cluster's simulation in front
        // of the broadcast, so a transaction that cannot succeed is refused rather than
        // landing as a failed transaction the sender pays for.
        //
        // `maxRetries: 0` stops the RPC node rebroadcasting, verified against
        // `agave@00bf3c6` `send-transaction-service/src/send_transaction_service.rs:273`,
        // which drops transactions with zero max retries. That is deliberate and it is
        // only safe because the caller can now resend the same bytes itself: rebroadcast
        // belongs to whoever holds the bytes, because only that party can guarantee they
        // are unchanged.
        {
          encoding: 'base64',
          skipPreflight: options?.skipPreflight ?? false,
          preflightCommitment: 'confirmed',
          maxRetries: 0,
        },
      ]);

      return requireSolanaTransactionSignature(result, '[solana/rpc]: sendTransaction returned a malformed signature');
    },

    async getSignatureStatuses(signatures, options) {
      if (signatures.length === 0) return [];

      const result = await call<{ value?: readonly (SolanaSignatureStatus | null)[] }>(client, 'getSignatureStatuses', [
        [...signatures],
        { searchTransactionHistory: options?.searchTransactionHistory ?? false },
      ]);

      return result.value ?? [];
    },

    async getBalance(address) {
      const result = await call<{ value?: number }>(client, 'getBalance', [address, { commitment: 'confirmed' }]);
      return toLamports(result.value, 'getBalance');
    },

    async getRecentPrioritizationFees(addresses) {
      const result = await call<readonly { slot: number; prioritizationFee: number }[]>(client, 'getRecentPrioritizationFees', [
        [...addresses],
      ]);

      return result.map(entry => ({
        slot: entry.slot,
        prioritizationFeeMicroLamports: toLamports(entry.prioritizationFee, 'getRecentPrioritizationFees'),
      }));
    },

    async getMinimumBalanceForRentExemption(dataLength) {
      const result = await call<number>(client, 'getMinimumBalanceForRentExemption', [dataLength, { commitment: 'confirmed' }]);
      return toLamports(result, 'getMinimumBalanceForRentExemption');
    },

    async getFeeForMessage(messageBytes) {
      const result = await call<{ value?: number | null }>(client, 'getFeeForMessage', [
        base64.encode(messageBytes),
        { commitment: 'confirmed' },
      ]);

      return result.value === null || result.value === undefined ? null : toLamports(result.value, 'getFeeForMessage');
    },
  };
}

/**
 * The sibling of `getProvider`, deliberately not a value inside it.
 *
 * Solana is kept out of `backendChains` precisely so that
 * `getProvider(SOLANA_LOCAL_CHAIN_ID)` could not return a broken EVM provider, and that
 * decision is not reopened here. A write needs a transport rather than a chain list, so
 * the transport is a sibling and the name says so.
 *
 * The hazard that decision avoids is live and measured: `getProvider` reads its
 * url from the chain catalog and hands the result to `new StaticJsonRpcProvider`, and for
 * a chain the catalog does not carry that url is `undefined`, whereupon ethers
 * substitutes `http://localhost:8545`. So `getProvider` for Solana does not fail loudly;
 * it returns a provider pointed at localhost. Never use provider truthiness as a proxy
 * for "this chain has a transport".
 */
export function getSolanaConnection(args: { readonly cluster: SolanaCluster }): SolanaRpcClient {
  return createSolanaRpcClient({ endpoint: SOLANA_CLUSTER_ENDPOINTS[args.cluster] });
}
