import {
  compact,
  isEmpty,
  isObject,
  orderBy,
  partition,
  reverse,
  slice,
  toUpper,
  uniqBy,
  upperFirst,
} from 'lodash';
import { parseAllTxnsOnReceive } from '../config/debug';
import {
  EthereumAddress,
  NativeCurrencyKey,
  RainbowTransaction,
  TransactionDirection,
  TransactionStatus,
  ZerionAsset,
  ZerionTransaction,
  ZerionTransactionChange,
} from '@/entities';
import { getTransactionMethodName } from '@/handlers/transactions';
import { isL2Network } from '@/handlers/web3';
import { Network } from '@/helpers/networkTypes';
import { ETH_ADDRESS } from '@/references';
import {
  convertAmountAndPriceToNativeDisplay,
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  toFixedDecimals,
} from '@/helpers/utilities';
import { ethereumUtils, getTokenMetadata } from '@/utils';
import {
  RAINBOW_ROUTER_CONTRACT_ADDRESS,
  SOCKET_REGISTRY_CONTRACT_ADDRESSESS,
} from '@rainbow-me/swaps';
import { RainbowTransactionFee } from '@/entities/transactions/transaction';
import * as i18n from '@/languages';
import { parseAddressAsset, parseAsset } from '@/resources/assets/assets';
import { AddysAsset, ParsedAsset } from '@/resources/assets/types';
import { transactionTypes } from '@/entities/transactions/transactionType';
import {
  PaginatedTransactionsApiResponse,
  TransactionApiResponse,
  TransactionChange,
  TransactionChanges,
  TransactionType,
  TransactionWithChangesType,
} from '@/resources/transactions/types';
import BigNumber from 'bignumber.js';

const LAST_TXN_HASH_BUFFER = 20;

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
] as const;

export const getDirection = (type: TransactionType) => {
  //@ts-expect-error - Ts doesnt like the weird type structure here
  if (TransactionOutTypes.includes(type as TransactionType)) return 'out';
  return 'in';
};

const dataFromLastTxHash = (
  transactionData: ZerionTransaction[],
  transactions: RainbowTransaction[]
): ZerionTransaction[] => {
  if (__DEV__ && parseAllTxnsOnReceive) return transactionData;
  const lastSuccessfulTxn = transactions.find(
    txn => !!txn.hash && !txn.pending
  );
  const lastTxHash = lastSuccessfulTxn?.hash;
  if (lastTxHash) {
    const lastTxnHashIndex = transactionData.findIndex(txn =>
      lastTxHash.startsWith(txn.hash)
    );
    if (lastTxnHashIndex > -1) {
      return slice(transactionData, 0, lastTxnHashIndex + LAST_TXN_HASH_BUFFER);
    }
  }
  return transactionData;
};

export const getAssetFromChanges = (
  changes: TransactionChanges,
  type: TransactionType
) => {
  if (type === 'sale') return changes?.find(c => c?.direction === 'out')?.asset;
  return changes?.[0]?.asset;
};

export const parseTransaction = async (
  transaction: TransactionApiResponse,
  nativeCurrency: NativeCurrencyKey
): Promise<RainbowTransaction> => {
  const { status, hash, meta, nonce, protocol } = transaction;

  let txn = {
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

  const type = isValidTransactionType(meta.type)
    ? meta.type
    : 'contract_interaction';

  if (type === 'mint') {
    console.log('MINT');
    changes?.map(change => {
      console.log(change?.asset);
    });
  }
  const asset: RainbowTransaction['asset'] = meta.asset?.asset_code
    ? parseAsset({ asset: meta.asset, address: meta.asset.asset_code })
    : getAssetFromChanges(changes, type);

  const direction = txn.direction || getDirection(type);

  const description = getDescription(asset, type, meta);

  const nativeAsset = changes.find(change => change?.asset.isNativeAsset);
  const nativeAssetPrice = nativeAsset?.price?.toString() || '0';

  const value = toFixedDecimals(
    nativeAsset?.value || '',
    nativeAsset?.asset?.decimals || 18
  );

  // this is probably wrong, need to revisit
  const native = convertAmountAndPriceToNativeDisplay(
    value,
    nativeAssetPrice,
    nativeCurrency
  );

  const fee = getTransactionFee(txn, nativeCurrency);

  const contract = meta.contract_name && {
    name: meta.contract_name,
    iconUrl: meta.contract_icon_url,
  };

  return {
    from: txn.address_from,
    to: txn.address_to,
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
  } as RainbowTransaction;
};

/**
 * Helper for retrieving tx fee sent by zerion, works only for mainnet only
 */
const getTransactionFee = (
  txn: TransactionApiResponse,
  nativeCurrency: NativeCurrencyKey
): RainbowTransactionFee | undefined => {
  if (txn.fee === null || txn.fee === undefined) {
    return undefined;
  }

  const zerionFee = txn.fee;
  return {
    // TODO: asset hardcoded for mainnet only need to add support for L2 networks
    value: convertRawAmountToBalance(zerionFee.value, {
      decimals: 18,
      symbol: 'ETH',
    }),
    native:
      nativeCurrency !== 'ETH' && zerionFee?.price > 0
        ? convertRawAmountToNativeDisplay(
            zerionFee.value,
            // TODO: asset decimals hardcoded for mainnet only need to add support for L2 networks
            18,
            zerionFee.price,
            nativeCurrency
          )
        : undefined,
  };
};

export const getDescription = (
  asset: ParsedAsset | undefined,
  type: TransactionType,
  meta: PaginatedTransactionsApiResponse['meta']
) => {
  if (asset?.type === 'nft') return asset.symbol || asset.name;
  if (type === 'cancel') return i18n.t('transactions.cancelled');

  return asset?.name || meta.action;
};

export const isValidTransactionType = (
  type: string | undefined
): type is TransactionType =>
  !!type &&
  //@ts-expect-error - Ts doesnt like the weird type structure here
  (transactionTypes.withChanges.includes(type as TransactionType) ||
    //@ts-expect-error - Ts doesnt like the weird type structure here
    transactionTypes.withoutChanges.includes(type as TransactionType) ||
    type === ('sale' as TransactionType));

export const transactionTypeShouldHaveChanges = (
  type: TransactionType
): type is TransactionWithChangesType =>
  //@ts-expect-error - Ts doesnt like the weird type structure here
  transactionTypes.withChanges.includes(type);
