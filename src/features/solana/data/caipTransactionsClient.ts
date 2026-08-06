import { type ParsedAddressAsset } from '@/entities/tokens';
import { TransactionDirection, TransactionStatus, type RainbowTransaction, type TransactionChanges } from '@/entities/transactions';
import { buildTransactionTitle, type RainbowTransactionFee } from '@/entities/transactions/transaction';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountAndPriceToNativeDisplay, convertRawAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { toLocalChainId, type CaipAsset, type CaipFailedQuery } from '@/features/network/api/caipBalancesClient';
import { parseCaipAssetId, type CaipAccountId } from '@/features/network/utils/caip';
import { type RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { convertRawAmountToBalance, toFixedDecimals } from '@/helpers/utilities';
import { getAssetFromChanges, getDirection, isValidTransactionType } from '@/parsers/transactions';
import { getUniqueId } from '@/utils/ethereumUtils';

/**
 * Client for the chain-agnostic transaction-history contract: a CAIP-native
 * `ListTransactions`. Nothing serves it today, and the service that would own it
 * carries no CAIP and no Solana concept at all, so unlike the balances contract
 * there is not even an existing message to transcribe from and this file is written
 * against a specification rather than a schema.
 *
 * It is a sibling of `src/resources/transactions/consolidatedTransactions.ts` and
 * never an edit of it: changing the contract of an endpoint the shipped app already
 * calls is out of bounds, and `/v1/transactions/ListTransactions` is exactly that.
 *
 * Four properties of the specified contract shape every type below, and each one is
 * a costed divergence from the v1 contract:
 *
 * - Identity is CAIP. `chainId` is CAIP-2 and an asset carries one CAIP-19
 *   `assetId` where v1 carries an `assetCode` plus a numeric `chainId`. The v1
 *   `network` string is deliberately absent, so this client cannot resolve a chain
 *   through `getChainsIdByName` the way the v1 path does; it translates CAIP-2 to
 *   the app's private number at this boundary.
 * - Failure is per account. `failedQueries` carries CAIP-10 account ids, so an
 *   account whose history is unknown is distinguishable from one with no history.
 * - Execution detail sits behind a `oneof`, marshalled by grpc-gateway as at most
 *   one of `evm` and `solana` being present. That is what lets this client leave
 *   `nonce`, `blockNumber` and `confirmations` undefined for a Solana row instead of
 *   writing zeros a consumer cannot tell from real values.
 * - `hash` is `identifier`, because a Solana signature is not a hash of anything.
 *
 * Field naming follows grpc-gateway's proto3 JSON marshalling, lowerCamelCase with
 * zero-valued fields omitted, which is why almost everything here is optional and
 * defaulted at the boundary.
 */

export const CAIP_TRANSACTIONS_PATH = '/transactions/ListTransactions';

export type CaipTransactionsRequest = {
  accounts: CaipAccountId[];
  currency: string;
  limit: number;
  cursor?: string;
  interactedWithAccount?: CaipAccountId;
};

export type CaipChange = {
  asset?: CaipAsset;
  direction?: string;
  addressFrom?: string;
  addressTo?: string;
  price?: string;
  quantity?: string;
  value?: string;
};

export type CaipTransactionMeta = {
  action?: string;
  type?: string;
  contractName?: string;
  contractIconUrl?: string;
  explorerLabel?: string;
  explorerUrl?: string;
  quantity?: string;
  asset?: CaipAsset;
};

/** The EVM branch of the execution `oneof`: every field the v1 contract kept flat. */
export type CaipEvmExecution = {
  addressFrom?: string;
  addressTo?: string;
  nonce?: number;
  blockNumber?: string;
  blockConfirmations?: number;
  callData?: string;
  fourbyte?: string;
  approvalTo?: string;
};

export type CaipSolanaInstruction = {
  programId?: string;
  programName?: string;
  discriminator?: string;
  accounts?: string[];
};

/**
 * The Solana branch. Three of these fields exist because a public Solana RPC
 * endpoint was probed rather than reasoning from the field list:
 *
 * - `feePayer` is not the sender. On the captured payment the fee payer was a third
 *   party who neither sent nor received the transferred token, so nothing may derive
 *   a transaction's `from` from this field.
 * - `prioritizationFee` has to be carried explicitly and cannot be derived from
 *   `computeUnitsConsumed`. The prioritization fee is charged on the compute-unit
 *   limit the transaction *requested*, not on what it consumed; on the captured
 *   swap those were 300000 and 165202, which differ by a factor of two in the fee.
 * - `commitment` is Solana's answer to `blockConfirmations`, and the three levels
 *   are Rainbow's own.
 */
export type CaipSolanaExecution = {
  feePayer?: string;
  slot?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  computeUnitsConsumed?: string;
  prioritizationFee?: string;
  instructions?: CaipSolanaInstruction[];
};

export type CaipTransaction = {
  id?: string;
  type?: string;
  chainId?: string;
  minedAt?: string;
  status?: string;
  identifier?: string;
  direction?: string;
  changes?: CaipChange[];
  fee?: { value?: string; price?: string };
  meta?: CaipTransactionMeta;
  evm?: CaipEvmExecution;
  solana?: CaipSolanaExecution;
};

export type CaipTransactionsResponse = {
  result?: CaipTransaction[];
  failedQueries?: CaipFailedQuery[];
  pagination?: { cursor?: string };
};

/** Why a returned transaction could not be represented as a `RainbowTransaction`. */
export type DroppedTransactionReason =
  | 'missing-chain-id'
  | 'unsupported-chain'
  | 'missing-identifier'
  /**
   * `buildTransactionsSections` drops a confirmed transaction with no timestamp
   * from the list without a word, so a transaction that reaches it untimestamped
   * disappears from the screen. Dropping it here instead makes that visible.
   */
  | 'missing-mined-at';

export type DroppedTransaction = {
  identifier: string | undefined;
  reason: DroppedTransactionReason;
};

export type CaipTransactionsResult = {
  transactions: RainbowTransaction[];
  /** Accounts whose history is unknown rather than empty. */
  failedAccounts: CaipFailedQuery[];
  /** Rows the response carried that this app cannot hold. Never silently discarded. */
  dropped: DroppedTransaction[];
  nextCursor: string | undefined;
};

/** The native asset a chain's fee is denominated in. The specified `Fee` message carries value and price only. */
export type FeeNativeAsset = { decimals: number; symbol: string };

/**
 * Maps one CAIP asset onto the app's parsed-asset shape.
 *
 * `isNativeAsset` comes from the CAIP-19 asset namespace rather than from
 * `@/handlers/assets`, and that is deliberate: the app's own helper compares an
 * asset's address to the chain's native address through `isLowerCaseMatch`, which
 * is a known hazard here because base58 is case-sensitive. A
 * CAIP-19 id says `native:` in a field, so this boundary never has to compare
 * addresses at all.
 */
function toParsedAddressAsset(asset: CaipAsset, quantity: string | undefined): ParsedAddressAsset | null {
  if (!asset.assetId) return null;

  const parsed = parseCaipAssetId(asset.assetId);
  if (!parsed) return null;

  const chainId = toLocalChainId(parsed.chainId);
  if (chainId === null) return null;

  const decimals = asset.decimals ?? 0;

  return {
    address: parsed.assetReference,
    balance: convertRawAmountToBalance(quantity ?? '0', { decimals, symbol: asset.symbol }),
    chainId,
    color: asset.colors?.primary,
    colors: asset.colors?.primary ? { fallback: asset.colors.fallback, primary: asset.colors.primary } : undefined,
    decimals,
    icon_url: asset.iconUrl,
    isNativeAsset: parsed.assetNamespace === 'native',
    name: asset.name ?? '',
    network: asset.network ?? '',
    price: {
      changed_at: asset.price?.changedAt ? Date.parse(asset.price.changedAt) : undefined,
      relative_change_24h: asset.price?.relativeChange24h ?? 0,
      value: asset.price?.value ?? 0,
    },
    symbol: asset.symbol ?? '',
    type: asset.type,
    uniqueId: getUniqueId(parsed.assetReference, chainId),
  };
}

function toChanges(changes: CaipChange[] | undefined): TransactionChanges {
  const parsedChanges: TransactionChanges = [];

  for (const change of changes ?? []) {
    if (!change.asset) continue;
    const asset = toParsedAddressAsset(change.asset, change.quantity);
    if (!asset) continue;

    parsedChanges.push({
      address_from: change.addressFrom ?? '',
      address_to: change.addressTo ?? '',
      asset,
      direction: change.direction as TransactionDirection,
      price: change.price ? parseFloat(change.price) : 0,
      value: change.value ? parseFloat(change.value) : undefined,
    });
  }

  return parsedChanges;
}

function toFee(
  fee: CaipTransaction['fee'],
  nativeAsset: FeeNativeAsset,
  nativeCurrency: NativeCurrencyKey
): RainbowTransactionFee | undefined {
  if (!fee?.value) return undefined;

  return {
    value: convertRawAmountToBalance(fee.value, nativeAsset),
    native:
      nativeCurrency !== 'ETH' && Number(fee.price) > 0
        ? convertRawAmountToNativeDisplay(fee.value, nativeAsset.decimals, fee.price ?? '0', nativeCurrency)
        : undefined,
  };
}

/**
 * Maps one CAIP transaction onto the app's transaction shape, or reports why it
 * cannot be mapped.
 *
 * `from` and `to` are read off the outgoing change, never off
 * `solana.feePayer`. The captured payment is a transaction whose
 * fee payer neither sent nor received the transferred token, so a row built from the
 * fee payer would name the wrong party in the one place a user reads a counterparty.
 */
export function toRainbowTransaction(
  transaction: CaipTransaction,
  nativeAsset: FeeNativeAsset,
  nativeCurrency: NativeCurrencyKey
): { transaction: RainbowTransaction } | { dropped: DroppedTransaction } {
  const { identifier, meta } = transaction;

  if (!transaction.chainId) return { dropped: { identifier, reason: 'missing-chain-id' } };
  const chainId = toLocalChainId(transaction.chainId);
  if (chainId === null) return { dropped: { identifier, reason: 'unsupported-chain' } };
  if (!identifier) return { dropped: { identifier, reason: 'missing-identifier' } };

  const minedAtMs = transaction.minedAt ? Date.parse(transaction.minedAt) : NaN;
  if (Number.isNaN(minedAtMs)) return { dropped: { identifier, reason: 'missing-mined-at' } };

  const type = isValidTransactionType(meta?.type) ? meta.type : 'contract_interaction';
  const changes = toChanges(transaction.changes);

  const asset = meta?.asset ? (toParsedAddressAsset(meta.asset, meta.quantity) ?? undefined) : getAssetFromChanges(changes, type);

  const nativeChange = changes.find(change => change?.asset.isNativeAsset);
  const value = toFixedDecimals(nativeChange?.value?.toString() ?? '', nativeChange?.asset.decimals ?? nativeAsset.decimals);
  // The change the counterparty is read from. The outgoing one when there is one,
  // because that is where a send's recipient lives; otherwise the first change,
  // because a receive has no outgoing change and its counterparty would otherwise be
  // lost. Observed on the device: with this falling through to null, the details
  // sheet renders a received transaction's from-and-to boxes with avatars and no
  // addresses under them.
  const counterpartyChange = changes.find(change => change?.direction === TransactionDirection.OUT) ?? changes[0];
  const status = (transaction.status as TransactionStatus) ?? TransactionStatus.confirmed;

  return {
    transaction: {
      asset,
      blockNumber: transaction.evm?.blockNumber ? Number(transaction.evm.blockNumber) : undefined,
      chainId,
      changes,
      confirmations: transaction.evm?.blockConfirmations,
      contract: meta?.contractName ? { iconUrl: meta.contractIconUrl, name: meta.contractName } : undefined,
      description: asset?.name || meta?.action,
      direction: (transaction.direction as TransactionDirection) || getDirection(type),
      explorerLabel: meta?.explorerLabel,
      explorerUrl: meta?.explorerUrl,
      fee: toFee(transaction.fee, nativeAsset, nativeCurrency),
      // `||` and not `??`: a change carries `''` where the wire omitted an address,
      // because the app's own change shape requires the field, and an empty string
      // is not an address that should shadow the execution branch's.
      from: counterpartyChange?.address_from || transaction.evm?.addressFrom || null,
      hash: identifier,
      minedAt: Math.floor(minedAtMs / 1000),
      native: convertAmountAndPriceToNativeDisplay(value, nativeChange?.price?.toString() ?? '0', nativeCurrency),
      network: asset?.network ?? '',
      nonce: transaction.evm?.nonce,
      status,
      title: buildTransactionTitle(type, status),
      to: counterpartyChange?.address_to || transaction.evm?.addressTo || null,
      type,
      value,
    },
  };
}

export function toCaipTransactionsResult(
  response: CaipTransactionsResponse,
  nativeAsset: FeeNativeAsset,
  nativeCurrency: NativeCurrencyKey
): CaipTransactionsResult {
  const transactions: RainbowTransaction[] = [];
  const dropped: DroppedTransaction[] = [];

  for (const transaction of response.result ?? []) {
    const mapped = toRainbowTransaction(transaction, nativeAsset, nativeCurrency);
    if ('transaction' in mapped) transactions.push(mapped.transaction);
    else dropped.push(mapped.dropped);
  }

  return {
    dropped,
    failedAccounts: response.failedQueries ?? [],
    nextCursor: response.pagination?.cursor,
    transactions,
  };
}

export async function fetchCaipTransactions(
  request: CaipTransactionsRequest,
  {
    abortController,
    client,
    nativeAsset,
    nativeCurrency,
  }: {
    abortController?: AbortController | null;
    client: Pick<RainbowFetchClient, 'post'>;
    nativeAsset: FeeNativeAsset;
    nativeCurrency: NativeCurrencyKey;
  }
): Promise<CaipTransactionsResult> {
  const response = await client.post<CaipTransactionsResponse>(CAIP_TRANSACTIONS_PATH, request, { abortController });
  return toCaipTransactionsResult(response.data, nativeAsset, nativeCurrency);
}
