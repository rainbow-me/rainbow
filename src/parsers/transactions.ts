import {
  compact,
  isEmpty,
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
  AssetType,
  EthereumAddress,
  NativeCurrencyKey,
  ProtocolType,
  ProtocolTypeNames,
  RainbowTransaction,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  ZerionAsset,
  ZerionTransaction,
  ZerionTransactionChange,
  ZerionTransactionStatus,
} from '@/entities';
import { getTransactionMethodName } from '@/handlers/transactions';
import { isL2Network } from '@/handlers/web3';
import { Network } from '@/helpers/networkTypes';
import { ETH_ADDRESS, savingsAssetsList } from '@/references';
import {
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
} from '@/helpers/utilities';
import { ethereumUtils, getTokenMetadata } from '@/utils';
import {
  RAINBOW_ROUTER_CONTRACT_ADDRESS,
  SOCKET_REGISTRY_CONTRACT_ADDRESSESS,
} from '@rainbow-me/swaps';
import { RainbowTransactionFee } from '@/entities/transactions/transaction';
import * as i18n from '@/languages';

const LAST_TXN_HASH_BUFFER = 20;

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

export const parseTransactions = async (
  transactionData: ZerionTransaction[],
  accountAddress: EthereumAddress,
  nativeCurrency: NativeCurrencyKey,
  existingTransactions: RainbowTransaction[],
  pendingTransactions: RainbowTransaction[],
  purchaseTransactions: any,
  network: Network,
  appended = false
) => {
  /**
   * This is empty because it previously pulled in data from our `addCash`
   * reducer, which was deprecated and removed.
   */
  const purchaseTransactionHashes: RainbowTransaction[] = [];

  // pending crosschain swaps transactions now depends on bridge status API
  // so we need to persist pending txs until bridge is done even tho the tx
  // on chain was confirmed https://github.com/rainbow-me/rainbow/pull/4189
  const pendingCrosschainSwapsTransactionHashes = pendingTransactions
    .filter(txn => txn.protocol === ProtocolType.socket)
    .map(txn => ethereumUtils.getHash(txn));
  const filteredExistingTransactions = existingTransactions.filter(
    txn =>
      !pendingCrosschainSwapsTransactionHashes.includes(
        ethereumUtils.getHash(txn)
      )
  );
  const [
    allL2Transactions,
    existingWithoutL2,
  ] = partition(filteredExistingTransactions, tx =>
    isL2Network(tx.network || '')
  );

  const data = appended
    ? transactionData
    : dataFromLastTxHash(transactionData, existingWithoutL2);

  const newTransactionPromises = data.map(txn =>
    parseTransaction(
      txn,
      nativeCurrency,
      // @ts-expect-error ts-migrate(100002) FIXME
      purchaseTransactionHashes,
      network
    )
  );

  const newTransactions = await Promise.all(newTransactionPromises);
  const parsedNewTransactions = newTransactions.flat();

  const updatedResults = parsedNewTransactions.concat(
    existingTransactions,
    allL2Transactions
  );

  const potentialNftTransaction = appended
    ? parsedNewTransactions.find(txn => {
        return (
          !txn.protocol &&
          (txn.type === TransactionType.send ||
            txn.type === TransactionType.receive) &&
          txn.symbol !== 'ETH'
        );
      })
    : null;

  const dedupedResults = uniqBy(updatedResults, txn => txn.hash);

  const orderedDedupedResults = orderBy(
    dedupedResults,
    ['minedAt', 'nonce'],
    ['desc', 'desc']
  );

  return {
    parsedTransactions: orderedDedupedResults,
    potentialNftTransaction,
  };
};

const transformTradeRefund = (
  internalTransactions: ZerionTransactionChange[]
) => {
  const [txnsOut, txnsIn] = partition(
    internalTransactions,
    txn => txn?.direction === TransactionDirection.out
  );
  const isSuccessfulSwap =
    txnsOut.length === 1 && (txnsIn.length === 1 || txnsIn.length === 2);
  if (!isSuccessfulSwap) return internalTransactions;

  const txnOut = txnsOut[0];
  const txnIn = txnsIn.find(
    txn => txn?.asset?.asset_code !== txnOut?.asset?.asset_code
  );
  const refund = txnsIn.find(
    txn => txn?.asset?.asset_code === txnOut?.asset?.asset_code
  );
  let updatedOut = txnOut;
  if (refund?.value && txnOut?.value) {
    updatedOut = {
      ...txnOut,
      value: txnOut.value - refund.value,
    };
  }
  return compact([updatedOut, txnIn]);
};

const overrideFailedCompound = (
  txn: ZerionTransaction,
  network: string
): ZerionTransaction => {
  // Compound shows success status even when there are internal failures
  // We are overriding to show the user a failure state if the action actually failed
  const isFailedCompoundTxn =
    isEmpty(txn?.changes) &&
    txn.protocol === ProtocolType.compound &&
    (txn.type === TransactionType.deposit ||
      txn.type === TransactionType.withdraw);
  if (!isFailedCompoundTxn) return txn;

  const newTxn = {
    ...txn,
  };
  newTxn.status = ZerionTransactionStatus.failed;
  const asset =
    savingsAssetsList[network][txn?.address_to?.toLowerCase() ?? ''];

  const assetInternalTransaction = {
    address_from: txn.address_from,
    address_to: txn.address_to,
    asset: {
      asset_code: asset.address,
      icon_url: null,
      price: null,
      type: AssetType.compound,
      ...asset,
    },
    direction: TransactionDirection.out,
    value: 0,
  };
  newTxn.changes = [assetInternalTransaction];
  return newTxn;
};

const overrideFailedExecution = (txn: ZerionTransaction): ZerionTransaction => {
  const isFailedExecution =
    isEmpty(txn?.changes) &&
    txn.status === ZerionTransactionStatus.failed &&
    txn.type === TransactionType.execution &&
    txn.direction === TransactionDirection.out;
  if (!isFailedExecution) return txn;

  const newTxn = {
    ...txn,
  };
  const assetInternalTransaction = {
    address_from: txn.address_from,
    address_to: txn.address_to,
    asset: {
      asset_code: ETH_ADDRESS,
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
      type: AssetType.eth,
    },
    direction: TransactionDirection.out,
    value: 0,
  };
  newTxn.changes = [assetInternalTransaction];
  return newTxn;
};

const overrideAuthorizations = (txn: ZerionTransaction): ZerionTransaction => {
  const isEmptyAuth =
    isEmpty(txn?.changes) && txn.type === TransactionType.authorize;
  if (!isEmptyAuth) return txn;

  const newTxn = {
    ...txn,
  };
  const approveInternalTransaction = {
    address_from: txn.address_from,
    address_to: txn.address_to,
    asset: txn?.meta?.asset as ZerionAsset,
    direction: TransactionDirection.out,
    value: 0,
  };
  newTxn.changes = [approveInternalTransaction];
  return newTxn;
};

const overrideSelfWalletConnect = (
  txn: ZerionTransaction
): ZerionTransaction => {
  // logic below: prevent sending a WalletConnect 0 amount to be ignored
  const isSelfWalletConnect =
    isEmpty(txn?.changes) &&
    txn.type === TransactionType.execution &&
    txn.direction === TransactionDirection.self;
  if (!isSelfWalletConnect) return txn;

  const newTxn = {
    ...txn,
  };
  const ethInternalTransaction = {
    address_from: txn.address_from,
    address_to: txn.address_to,
    asset: {
      asset_code: ETH_ADDRESS,
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
      type: AssetType.eth,
    },
    direction: TransactionDirection.out,
    value: 0,
  };
  newTxn.changes = [ethInternalTransaction];
  return newTxn;
};

const overrideTradeRefund = (txn: ZerionTransaction): ZerionTransaction => {
  if (txn.type !== TransactionType.trade) return txn;
  return {
    ...txn,
    changes: transformTradeRefund(txn?.changes),
  };
};

const swapAddresses = ((): Set<string> => {
  const contractAddresses = new Set(
    Array.from(SOCKET_REGISTRY_CONTRACT_ADDRESSESS.values()).map(addr =>
      addr.toLowerCase()
    )
  );

  contractAddresses.add(RAINBOW_ROUTER_CONTRACT_ADDRESS.toLowerCase());

  return contractAddresses;
})();

const overrideSwap = (tx: ZerionTransaction): ZerionTransaction => {
  const to = tx.address_to?.toLowerCase() || '';

  if (swapAddresses.has(to)) {
    return { ...tx, type: TransactionType.trade };
  }
  return tx;
};

const parseTransactionWithEmptyChanges = async (
  txn: ZerionTransaction,
  nativeCurrency: NativeCurrencyKey,
  network: Network
) => {
  const methodName = await getTransactionMethodName(txn);
  const updatedAsset = {
    address: ETH_ADDRESS,
    decimals: 18,
    name: 'ethereum',
    symbol: 'ETH',
  };
  const priceUnit = 0;
  const valueUnit = 0;
  const nativeDisplay = convertRawAmountToNativeDisplay(
    0,
    18,
    priceUnit,
    nativeCurrency
  );
  const fee =
    network === Network.mainnet
      ? getTransactionFee(txn, nativeCurrency)
      : undefined;
  return [
    {
      address: ETH_ADDRESS,
      balance: isL2Network(network)
        ? { amount: '', display: '-' }
        : convertRawAmountToBalance(valueUnit, updatedAsset),
      description: methodName || i18n.t(i18n.l.transactions.signed),
      from: txn.address_from,
      hash: `${txn.hash}-${0}`,
      minedAt: txn.mined_at,
      name: methodName || i18n.t(i18n.l.transactions.signed),
      native: nativeDisplay,
      network,
      nonce: txn.nonce,
      pending: false,
      protocol: txn.protocol,
      status: TransactionStatus.contract_interaction,
      symbol: 'contract',
      title: i18n.t(i18n.l.transactions.contract_interaction),
      to: txn.address_to,
      type: TransactionType.contract_interaction,
      fee,
    },
  ];
};

const parseTransaction = async (
  transaction: ZerionTransaction,
  nativeCurrency: NativeCurrencyKey,
  purchaseTransactionsHashes: string[],
  network: Network
): Promise<RainbowTransaction[]> => {
  let txn = {
    ...transaction,
  };
  txn = overrideFailedCompound(txn, network);
  txn = overrideFailedExecution(txn);
  txn = overrideAuthorizations(txn);
  txn = overrideSelfWalletConnect(txn);
  txn = overrideTradeRefund(txn);
  txn = overrideSwap(txn);

  if (txn.changes.length) {
    const fee =
      network === Network.mainnet
        ? getTransactionFee(txn, nativeCurrency)
        : undefined;
    const internalTransactions = txn.changes.map(
      (internalTxn, index): RainbowTransaction => {
        const address = internalTxn?.asset?.asset_code?.toLowerCase() ?? '';
        const metadata = getTokenMetadata(address);
        const updatedAsset = {
          address,
          decimals: internalTxn?.asset?.decimals,
          name: internalTxn?.asset?.name,
          symbol: toUpper(internalTxn?.asset?.symbol ?? ''),
          ...metadata,
        };
        const priceUnit =
          internalTxn.price ?? internalTxn?.asset?.price?.value ?? 0;
        const valueUnit = internalTxn.value || 0;
        const nativeDisplay = convertRawAmountToNativeDisplay(
          valueUnit,
          updatedAsset.decimals,
          priceUnit,
          nativeCurrency
        );

        if (purchaseTransactionsHashes.includes(txn.hash.toLowerCase())) {
          txn.type = TransactionType.purchase;
        }

        const status = getTransactionLabel({
          direction: internalTxn.direction || txn.direction,
          pending: false,
          protocol: txn.protocol,
          status: txn.status,
          type: txn.type,
        });

        const title = getTitle({
          protocol: txn.protocol,
          status,
          type: txn.type,
        });

        const description = getDescription({
          name: updatedAsset.name,
          status,
          type: txn.type,
        });

        return {
          address:
            updatedAsset.address.toLowerCase() === ETH_ADDRESS
              ? ETH_ADDRESS
              : updatedAsset.address,
          balance: convertRawAmountToBalance(valueUnit, updatedAsset),
          description,
          from: internalTxn.address_from ?? txn.address_from,
          hash: `${txn.hash}-${index}`,
          minedAt: txn.mined_at,
          name: updatedAsset.name,
          native: isL2Network(network)
            ? { amount: '', display: '' }
            : nativeDisplay,
          network,
          nonce: txn.nonce,
          pending: false,
          protocol: txn.protocol,
          status,
          symbol: updatedAsset.symbol,
          title,
          to: internalTxn.address_to ?? txn.address_to,
          type: txn.type,
          fee,
        };
      }
    );
    return reverse(internalTransactions);
  }
  const parsedTransaction = await parseTransactionWithEmptyChanges(
    txn,
    nativeCurrency,
    network
  );
  return parsedTransaction;
};

/**
 * Helper for retrieving tx fee sent by zerion, works only for mainnet only
 */
const getTransactionFee = (
  txn: ZerionTransaction,
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

export const getTitle = ({
  protocol,
  status,
  type,
}: {
  protocol: ProtocolType | null | undefined;
  status: TransactionStatus;
  type?: TransactionType;
}) => {
  if (
    protocol &&
    (type === TransactionType.deposit || type === TransactionType.withdraw)
  ) {
    if (
      status === TransactionStatus.deposited ||
      status === TransactionStatus.withdrew ||
      status === TransactionStatus.sent ||
      status === TransactionStatus.received
    ) {
      if (protocol === ProtocolType.compound) {
        return i18n.t(i18n.l.transactions.savings);
      } else {
        return ProtocolTypeNames?.[protocol];
      }
    }
  }
  return upperFirst(status);
};

export const getDescription = ({
  name,
  status,
  type,
}: {
  name: string | null;
  status: TransactionStatus;
  type: TransactionType;
}) => {
  switch (type) {
    case TransactionType.deposit:
      return status === TransactionStatus.depositing ||
        status === TransactionStatus.sending
        ? name
        : i18n.t(i18n.l.transactions.deposited_with_token, { name: name! });
    case TransactionType.withdraw:
      return status === TransactionStatus.withdrawing ||
        status === TransactionStatus.receiving
        ? name
        : i18n.t(i18n.l.transactions.withdrew_with_token, { name: name! });
    default:
      return name;
  }
};

export const getTransactionLabel = ({
  direction,
  pending,
  protocol,
  status,
  type,
}: {
  direction: TransactionDirection | null;
  pending: boolean;
  protocol: ProtocolType | null | undefined;
  status: ZerionTransactionStatus | TransactionStatus;
  type?: TransactionType;
}) => {
  if (status === TransactionStatus.cancelling)
    return TransactionStatus.cancelling;

  if (status === TransactionStatus.cancelled)
    return TransactionStatus.cancelled;

  if (
    status === TransactionStatus.selling ||
    (type === TransactionType.sell && pending)
  ) {
    return TransactionStatus.selling;
  }

  if (
    status === TransactionStatus.sold ||
    (type === TransactionType.sell && !pending)
  )
    return TransactionStatus.sold;

  if (status === TransactionStatus.speeding_up)
    return TransactionStatus.speeding_up;

  if (pending && type === TransactionType.purchase)
    return TransactionStatus.purchasing;

  const isFromAccount = direction === TransactionDirection.out;
  const isToAccount = direction === TransactionDirection.in;
  const isSelf = direction === TransactionDirection.self;

  if (pending && type === TransactionType.authorize)
    return TransactionStatus.approving;

  if (pending && type === TransactionType.deposit) {
    if (protocol === ProtocolType.compound) {
      return TransactionStatus.depositing;
    } else {
      return TransactionStatus.sending;
    }
  }

  if (pending && type === TransactionType.withdraw) {
    if (protocol === ProtocolType.compound) {
      return TransactionStatus.withdrawing;
    } else {
      return TransactionStatus.receiving;
    }
  }

  if (pending && isFromAccount) return TransactionStatus.sending;
  if (pending && isToAccount) return TransactionStatus.receiving;

  if (status === TransactionStatus.failed) return TransactionStatus.failed;
  if (status === TransactionStatus.dropped) return TransactionStatus.dropped;

  if (type === TransactionType.trade && isFromAccount)
    return TransactionStatus.swapped;

  if (type === TransactionType.authorize) return TransactionStatus.approved;
  if (type === TransactionType.purchase) return TransactionStatus.purchased;
  if (type === TransactionType.cancel) return TransactionStatus.cancelled;

  if (type === TransactionType.deposit) {
    if (protocol === ProtocolType.compound) {
      return TransactionStatus.deposited;
    } else {
      return TransactionStatus.sent;
    }
  }

  if (type === TransactionType.withdraw) {
    if (protocol === ProtocolType.compound) {
      return TransactionStatus.withdrew;
    } else {
      return TransactionStatus.received;
    }
  }

  if (isSelf) return TransactionStatus.self;

  if (isFromAccount) return TransactionStatus.sent;
  if (isToAccount) return TransactionStatus.received;

  return TransactionStatus.unknown;
};
