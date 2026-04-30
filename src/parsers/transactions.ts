import { BigNumber } from '@ethersproject/bignumber';
import { hexlify } from '@ethersproject/bytes';

import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import {
  TransactionDirection,
  TransactionStatus,
  TransactionTypeMap,
  type RainbowTransaction,
  type TransactionChanges,
  type TransactionType,
  type TransactionWithChangesType,
  type TransactionWithoutChangesType,
} from '@/entities/transactions';
import { buildTransactionTitle, type NewTransaction, type RainbowTransactionFee } from '@/entities/transactions/transaction';
import { type Meta, type Transaction } from '@/features/positions/types/generated/transaction/transaction';
import {
  convertAmountAndPriceToNativeDisplay,
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  toFixedDecimals,
} from '@/helpers/utilities';
import { parseGoldskyAddressAsset, parseGoldskyAsset } from '@/resources/assets/assets';
import { type ParsedAsset } from '@/resources/assets/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';

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

export const parseTransaction = (transaction: Transaction, nativeCurrency: NativeCurrencyKey, chainId: ChainId): RainbowTransaction => {
  const { hash, meta, nonce, status } = transaction;

  const txn = {
    ...transaction,
    changes: Array.isArray(transaction.changes) ? transaction.changes : [],
  };

  const minedAtTimestamp = txn.minedAt ? Math.floor(new Date(txn.minedAt).getTime() / 1000) : null;

  const changes: TransactionChanges =
    txn.changes
      .map(change => {
        if (!change.asset) return null;
        return {
          asset: parseGoldskyAddressAsset({
            assetData: {
              asset: change.asset,
              quantity: change.quantity || '0',
            },
          }),
          value: change.value ? parseFloat(change.value) : undefined,
          address_from: change.addressFrom,
          address_to: change.addressTo,
          direction: change.direction as TransactionDirection,
          price: change.price ? parseFloat(change.price) : 0,
        };
      })
      .filter(Boolean) || [];

  const type = isValidTransactionType(meta?.type) ? meta.type : 'contract_interaction';
  const fallbackMetaAsset =
    type === 'approve' && meta?.asset ? parseGoldskyAsset({ asset: meta.asset, address: txn.addressTo ?? '' }) : undefined;

  const asset: RainbowTransaction['asset'] = meta?.asset?.assetCode
    ? parseGoldskyAsset({ asset: meta.asset, address: meta.asset.assetCode })
    : (getAssetFromChanges(changes, type) ?? fallbackMetaAsset);

  const direction = txn.direction || getDirection(type);

  const description = getDescription(asset, meta);

  const nativeAsset = changes.find(change => change?.asset.isNativeAsset);
  const nativeAssetPrice = nativeAsset?.price?.toString() || '0';

  const decimals = typeof nativeAsset?.asset?.decimals === 'number' ? nativeAsset.asset.decimals : 18;
  const value = toFixedDecimals(nativeAsset?.value || '', decimals);

  // this is probably wrong, need to revisit
  const native = convertAmountAndPriceToNativeDisplay(value, nativeAssetPrice, nativeCurrency);

  const fee = getTransactionFee(txn, nativeCurrency, chainId);

  const contract = meta?.contractName
    ? {
        name: meta.contractName,
        iconUrl: meta.contractIconUrl,
      }
    : undefined;

  // NOTE: For send transactions, the to address should be pulled from the outgoing change directly, not the txn.address_to
  let to = txn.addressTo;
  if (meta?.type === 'send') {
    to = txn.changes.find(change => change?.direction === 'out')?.addressTo ?? txn.addressTo;
  }

  return {
    chainId,
    from: txn.addressFrom,
    to,
    title: buildTransactionTitle(type, status as TransactionStatus),
    description,
    hash,
    network: txn.network,
    status: status as TransactionStatus,
    nonce,
    type,
    direction: direction as TransactionDirection,
    value,
    changes,
    asset,
    approvalAmount: meta?.quantity as 'UNLIMITED' | (string & Record<string, never>),
    minedAt: minedAtTimestamp,
    blockNumber: txn.blockNumber,
    confirmations: txn.blockConfirmations,
    contract,
    native,
    fee,
    explorerUrl: meta?.explorerUrl,
    explorerLabel: meta?.explorerLabel,
  } satisfies RainbowTransaction;
};

export const convertNewTransactionToRainbowTransaction = (tx: NewTransaction): RainbowTransaction => {
  const asset = tx?.changes?.[0]?.asset || tx.asset;
  const status = TransactionStatus.pending;

  return {
    ...tx,
    asset,
    status,
    data: serializeTransactionData(tx.data),
    title: buildTransactionTitle(tx.type, status),
    description: asset?.name,
    from: tx.from,
    changes: tx.changes,
    hash: tx.hash,
    nonce: tx.nonce,
    protocol: tx.protocol,
    timestamp: Date.now(),
    to: tx.to,
    type: tx.type,
    value: serializeBigNumberish(tx.value),
    gasLimit: serializeBigNumberish(tx.gasLimit),
    gasPrice: serializeBigNumberish(tx.gasPrice),
    maxFeePerGas: serializeBigNumberish(tx.maxFeePerGas),
    maxPriorityFeePerGas: serializeBigNumberish(tx.maxPriorityFeePerGas),
  };
};

function serializeBigNumberish(value: RainbowTransaction['value']): string | undefined {
  if (value === undefined || value === null) return undefined;
  return BigNumber.from(value).toString();
}

function serializeTransactionData(data: RainbowTransaction['data']): string | undefined {
  if (data === undefined || data === null) return undefined;
  return typeof data === 'string' ? data : hexlify(data);
}

/**
 * Helper for retrieving tx fee sent by zerion, works only for mainnet only
 */
const getTransactionFee = (txn: Transaction, nativeCurrency: NativeCurrencyKey, chainId: ChainId): RainbowTransactionFee | undefined => {
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
      nativeCurrency !== 'ETH' && Number(zerionFee?.price) > 0
        ? convertRawAmountToNativeDisplay(zerionFee.value, chainNativeAsset.decimals, zerionFee.price, nativeCurrency)
        : undefined,
  };
};

export const getDescription = (asset: ParsedAsset | undefined, meta?: Meta) => {
  if (asset?.type === 'nft') return asset.symbol || asset.name;
  return asset?.name || meta?.action;
};

export const isValidTransactionType = (type: string | undefined): type is TransactionType =>
  !!type &&
  (TransactionTypeMap.withChanges.includes(type as TransactionWithChangesType) ||
    TransactionTypeMap.withoutChanges.includes(type as TransactionWithoutChangesType) ||
    type === 'sale');
