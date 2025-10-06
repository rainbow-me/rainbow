import {
  EthereumAddress,
  NativeCurrencyKey,
  NormalizedTransactionApiResponse,
  RainbowTransaction,
  TransactionDirection,
  TransactionChanges,
  TransactionStatus,
  TransactionType,
  TransactionApiResponse,
  TransactionTypeMap,
  TransactionWithChangesType,
  TransactionWithoutChangesType,
} from '@/entities';

import {
  convertAmountAndPriceToNativeDisplay,
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  toFixedDecimals,
} from '@/helpers/utilities';

import { NewTransaction, RainbowTransactionFee } from '@/entities/transactions/transaction';
import { parseAddressAsset, parseAsset } from '@/resources/assets/assets';
import { ParsedAsset } from '@/resources/assets/types';

import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { getUniqueId } from '@/utils/ethereumUtils';

const TransactionOutTypes = [
  'burn',
  'send',
  'deposit',
  'repay',
  'stake',
  'sale',
  'bridge',
  'bid',
  'speed_up',
  'revoke',
  'deployment',
  'contract_interaction',
] as readonly string[];

export const getDirection = (type: TransactionType): TransactionDirection => {
  if (TransactionOutTypes.includes(type)) return TransactionDirection.OUT;
  return TransactionDirection.IN;
};

export const getAssetFromChanges = (changes: TransactionChanges, type: TransactionType) => {
  if (type === 'sale') return changes?.find(c => c?.direction === 'out')?.asset;
  if (type === 'launch') return changes?.find(c => c?.asset && !c.asset.isNativeAsset)?.asset;
  return changes?.[0]?.asset;
};

export const parseTransaction = (
  transaction: NormalizedTransactionApiResponse,
  nativeCurrency: NativeCurrencyKey,
  chainId: ChainId
): RainbowTransaction => {
  const { status, hash, meta, nonce } = transaction;

  const txn = {
    ...transaction,
    changes: Array.isArray(transaction.changes) ? transaction.changes : [],
  };
  const changes: TransactionChanges = txn.changes
    .map(change => {
      if (!change) return undefined;
      return {
        asset: parseAddressAsset({
          assetData: {
            asset: change.asset,
            quantity: change.quantity || '0',
          },
        }),
        value: change.quantity ? parseFloat(change.quantity) : undefined,
        direction: change.direction as TransactionDirection,
        address_from: change.addressFrom,
        address_to: change.addressTo,
        price: parseFloat(change.price || '0'),
      };
    })
    .filter((change): change is Exclude<TransactionChanges[number], undefined> => change !== undefined);

  const type = isValidTransactionType(meta?.type) ? meta.type : 'contract_interaction';

  let asset: ParsedAsset | undefined = meta?.asset?.assetCode
    ? parseAsset({ asset: meta.asset, address: meta?.asset.assetCode })
    : getAssetFromChanges(changes, type);

  if (!asset && txn.addressTo) {
    const uniqueId = getUniqueId(txn.addressTo as EthereumAddress, chainId);
    const cachedAsset = userAssetsStore.getState().getLegacyUserAsset(uniqueId);

    if (cachedAsset) {
      const { balance: _balance, ...cachedAssetWithoutBalance } = cachedAsset;
      asset = cachedAssetWithoutBalance;
    }
  }

  const direction = txn.direction || getDirection(type);

  const description = getDescription(asset, type, meta);

  const nativeAsset = changes.find(change => change?.asset.isNativeAsset);
  const nativeAssetPrice = nativeAsset?.price?.toString() || '0';

  const decimals = typeof nativeAsset?.asset?.decimals === 'number' ? nativeAsset.asset.decimals : 18;
  const value = toFixedDecimals(nativeAsset?.value || '', decimals);

  // this is probably wrong, need to revisit
  const native = convertAmountAndPriceToNativeDisplay(value, nativeAssetPrice, nativeCurrency);

  const fee = getTransactionFee(txn, nativeCurrency, chainId);

  const contract = meta?.contractName && {
    name: meta.contractName,
    iconUrl: meta.contractIconUrl,
  };

  // NOTE: For send transactions, the to address should be pulled from the outgoing change directly, not the txn.address_to
  let to = txn.addressTo;
  if (meta?.type === 'send') {
    to = txn.changes.find(change => change?.direction === 'out')?.addressTo ?? txn.addressTo;
  }

  return {
    chainId,
    from: txn.addressFrom,
    to,
    title: buildTransactionTitle(type, status),
    description,
    hash,
    network: txn.network,
    status,
    nonce,
    // TODO: Fix this don't get from goldsky
    protocol: undefined,
    type,
    direction,
    value,
    changes,
    asset,
    approvalAmount: meta?.quantity,
    minedAt: txn.minedAt,
    blockNumber: txn.blockNumber,
    confirmations: txn.blockConfirmations,
    contract,
    native,
    fee,
    explorerUrl: meta?.explorerUrl,
    explorerLabel: meta?.explorerLabel,
  } as RainbowTransaction;
};

export const convertNewTransactionToRainbowTransaction = (tx: NewTransaction): RainbowTransaction => {
  const asset = tx?.changes?.[0]?.asset || tx.asset;

  return {
    ...tx,
    asset,
    status: TransactionStatus.pending,
    data: tx.data,
    title: `${tx.type}.${tx.status}`,
    description: asset?.name,
    from: tx.from,
    changes: tx.changes,
    hash: tx.hash,
    nonce: tx.nonce,
    protocol: tx.protocol,
    timestamp: Date.now(),
    to: tx.to,
    type: tx.type,
    gasPrice: tx.gasPrice,
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
  };
};

/**
 * Helper for retrieving tx fee sent by zerion, works only for mainnet only
 */
const getTransactionFee = (
  txn: TransactionApiResponse,
  nativeCurrency: NativeCurrencyKey,
  chainId: ChainId
): RainbowTransactionFee | undefined => {
  if (txn.fee === null || txn.fee === undefined) {
    return undefined;
  }

  const chainNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];

  const zerionFee = txn.fee;
  return {
    value: convertRawAmountToBalance(zerionFee.value, {
      decimals: chainNativeAsset.decimals,
      symbol: chainNativeAsset.symbol,
    }),
    native:
      nativeCurrency !== 'ETH' && Number(zerionFee?.value) > 0
        ? convertRawAmountToNativeDisplay(zerionFee.value, chainNativeAsset.decimals, zerionFee.price, nativeCurrency)
        : undefined,
  };
};

// TODO: Use paginated ?
export const getDescription = (asset: ParsedAsset | undefined, type: TransactionType, meta?: TransactionApiResponse['meta']) => {
  if (asset?.type === 'nft') return asset.symbol || asset.name;
  return asset?.name || meta?.action;
};

export const isValidTransactionType = (type: string | undefined): type is TransactionType =>
  !!type &&
  (TransactionTypeMap.withChanges.includes(type as TransactionWithChangesType) ||
    TransactionTypeMap.withoutChanges.includes(type as TransactionWithoutChangesType) ||
    type === 'sale');

export const isValidTransactionStatus = (status: unknown): status is TransactionStatus =>
  status === TransactionStatus.confirmed || status === TransactionStatus.failed || status === TransactionStatus.pending;

/**
 * Builds a transaction `title` from a transaction `type` and `status`.
 */
export function buildTransactionTitle(type: TransactionType, status: TransactionStatus): string {
  return `${type}.${status}`;
}
