import {
  NativeCurrencyKey,
  RainbowTransaction,
  TransactionDirection,
  PaginatedTransactionsApiResponse,
  TransactionApiResponse,
  TransactionChanges,
  TransactionStatus,
  TransactionType,
  TransactionWithChangesType,
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
  return changes?.[0]?.asset;
};

export const parseTransaction = async (
  transaction: TransactionApiResponse,
  nativeCurrency: NativeCurrencyKey,
  chainId: ChainId
): Promise<RainbowTransaction> => {
  const { status, hash, meta, nonce, protocol } = transaction;

  const txn = {
    ...transaction,
  };
  const changes: TransactionChanges = txn.changes.map(change => {
    if (change) {
      return {
        ...change,
        asset: parseAddressAsset({
          assetData: {
            asset: change.asset,
            quantity: change.value?.toString() || '0',
          },
        }),
        value: change.value || undefined,
      };
    }
  });

  const type = isValidTransactionType(meta.type) ? meta.type : 'contract_interaction';

  const asset: RainbowTransaction['asset'] = meta.asset?.asset_code
    ? parseAsset({ asset: meta.asset, address: meta.asset.asset_code })
    : getAssetFromChanges(changes, type);

  const direction = txn.direction || getDirection(type);

  const description = getDescription(asset, type, meta);

  const nativeAsset = changes.find(change => change?.asset.isNativeAsset);
  const nativeAssetPrice = nativeAsset?.price?.toString() || '0';

  const decimals = typeof nativeAsset?.asset?.decimals === 'number' ? nativeAsset.asset.decimals : 18;
  const value = toFixedDecimals(nativeAsset?.value || '', decimals);

  // this is probably wrong, need to revisit
  const native = convertAmountAndPriceToNativeDisplay(value, nativeAssetPrice, nativeCurrency);

  const fee = getTransactionFee(txn, nativeCurrency, chainId);

  const contract = meta.contract_name && {
    name: meta.contract_name,
    iconUrl: meta.contract_icon_url,
  };

  // NOTE: For send transactions, the to address should be pulled from the outgoing change directly, not the txn.address_to
  let to = txn.address_to;
  if (meta.type === 'send') {
    to = txn.changes.find(change => change?.direction === 'out')?.address_to ?? txn.address_to;
  }

  return {
    chainId,
    from: txn.address_from,
    to,
    title: `${type}.${status}`,
    description,
    hash,
    network: txn.network,
    status,
    nonce,
    protocol,
    type,
    direction,
    value,
    changes,
    asset,
    approvalAmount: meta.quantity,
    minedAt: txn.mined_at,
    blockNumber: txn.block_number,
    confirmations: txn.block_confirmations,
    contract,
    native,
    fee,
    explorerUrl: meta.explorer_url,
    explorerLabel: meta.explorer_label,
  } as RainbowTransaction;
};

export const convertNewTransactionToRainbowTransaction = (tx: NewTransaction): RainbowTransaction => {
  const asset = tx?.changes?.[0]?.asset || tx.asset;

  return {
    ...tx,
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
      nativeCurrency !== 'ETH' && zerionFee?.price > 0
        ? convertRawAmountToNativeDisplay(zerionFee.value, chainNativeAsset.decimals, zerionFee.price, nativeCurrency)
        : undefined,
  };
};

export const getDescription = (asset: ParsedAsset | undefined, type: TransactionType, meta: PaginatedTransactionsApiResponse['meta']) => {
  if (asset?.type === 'nft') return asset.symbol || asset.name;
  return asset?.name || meta.action;
};

export const isValidTransactionType = (type: string | undefined): type is TransactionType =>
  !!type &&
  (TransactionType.withChanges.includes(type as TransactionType) ||
    TransactionType.withoutChanges.includes(type as TransactionType) ||
    type === ('sale' as TransactionType));

export const transactionTypeShouldHaveChanges = (type: TransactionType): type is TransactionWithChangesType =>
  TransactionType.withChanges.includes(type);
