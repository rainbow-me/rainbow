import {
  compact,
  concat,
  filter,
  find,
  findIndex,
  flatten,
  get,
  includes,
  isEmpty,
  map,
  orderBy,
  partition,
  pick,
  reverse,
  slice,
  startsWith,
  toLower,
  toUpper,
  uniqBy,
  upperFirst,
} from 'lodash';
import { parseAllTxnsOnReceive } from '../config/debug';
import { toChecksumAddress } from '../handlers/web3';
import ProtocolTypes from '../helpers/protocolTypes';
import DirectionTypes from '../helpers/transactionDirectionTypes';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import TransactionTypes from '../helpers/transactionTypes';
import {
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
} from '../helpers/utilities';
import { savingsAssetsList, tokenOverrides } from '../references';
import { ethereumUtils } from '../utils';

const LAST_TXN_HASH_BUFFER = 20;

const dataFromLastTxHash = (transactionData, transactions) => {
  if (__DEV__ && parseAllTxnsOnReceive) return transactionData;
  const lastSuccessfulTxn = find(transactions, txn => txn.hash && !txn.pending);
  const lastTxHash = lastSuccessfulTxn ? lastSuccessfulTxn.hash : '';
  if (lastTxHash) {
    const lastTxnHashIndex = findIndex(transactionData, txn =>
      lastTxHash.startsWith(txn.hash)
    );
    if (lastTxnHashIndex > -1) {
      return slice(transactionData, 0, lastTxnHashIndex + LAST_TXN_HASH_BUFFER);
    }
  }
  return transactionData;
};

export const parseTransactions = (
  transactionData,
  accountAddress,
  nativeCurrency,
  existingTransactions,
  purchaseTransactions,
  network,
  appended = false
) => {
  const purchaseTransactionHashes = map(purchaseTransactions, txn =>
    ethereumUtils.getHash(txn)
  );
  const data = appended
    ? transactionData
    : dataFromLastTxHash(transactionData, existingTransactions);

  const parsedNewTransactions = flatten(
    data.map(txn =>
      parseTransaction(
        txn,
        accountAddress,
        nativeCurrency,
        purchaseTransactionHashes,
        network
      )
    )
  );

  const [pendingTransactions, remainingTransactions] = partition(
    existingTransactions,
    txn => txn.pending
  );

  const updatedPendingTransactions = dedupePendingTransactions(
    accountAddress,
    pendingTransactions,
    parsedNewTransactions
  );

  const updatedResults = concat(
    updatedPendingTransactions,
    parsedNewTransactions,
    remainingTransactions
  );

  const potentialNftTransaction = appended
    ? find(parsedNewTransactions, txn => {
        return (
          !txn.protocol &&
          (txn.type === 'send' || txn.type === 'receive') &&
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

const transformTradeRefund = internalTransactions => {
  const [txnsOut, txnsIn] = partition(
    internalTransactions,
    txn => txn.direction === DirectionTypes.out
  );
  const isSuccessfulSwap =
    txnsOut.length === 1 && (txnsIn.length === 1 || txnsIn.length === 2);
  if (!isSuccessfulSwap) return internalTransactions;

  const txnOut = txnsOut[0];
  const txnIn = find(
    txnsIn,
    txn => txn.asset.asset_code !== txnOut.asset.asset_code
  );
  const refund = find(
    txnsIn,
    txn => txn.asset.asset_code === txnOut.asset.asset_code
  );
  let updatedOut = txnOut;
  if (refund && txnOut) {
    updatedOut = {
      ...txnOut,
      value: txnOut.value - refund.value,
    };
  }
  return compact([updatedOut, txnIn]);
};

const parseTransaction = (
  txn,
  accountAddress,
  nativeCurrency,
  purchaseTransactions,
  network
) => {
  const transaction = pick(txn, [
    'hash',
    'nonce',
    'protocol',
    'status',
    'type',
  ]);
  transaction.from = txn.address_from;
  transaction.minedAt = txn.mined_at;
  transaction.pending = false;
  transaction.to = txn.address_to;

  const changes = get(txn, 'changes', []);
  let internalTransactions = changes;

  // Compound shows success status even when there are internal failures
  // We are overriding to show the user a failure state if the action actually failed
  if (
    isEmpty(changes) &&
    txn.protocol === ProtocolTypes.compound.name &&
    (txn.type === TransactionTypes.deposit ||
      txn.type === TransactionTypes.withdraw)
  ) {
    transaction.status = TransactionStatusTypes.failed;
    const asset = savingsAssetsList[network][toLower(transaction.to)];

    const assetInternalTransaction = {
      address_from: transaction.from,
      address_to: transaction.to,
      asset,
      value: transaction.value,
    };
    internalTransactions = [assetInternalTransaction];
  }

  if (
    isEmpty(changes) &&
    txn.status === TransactionStatusTypes.failed &&
    txn.type === TransactionTypes.execution &&
    txn.direction === 'out'
  ) {
    const assetInternalTransaction = {
      address_from: transaction.from,
      address_to: transaction.to,
      asset: {
        address: 'eth',
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
      value: 0,
    };
    internalTransactions = [assetInternalTransaction];
  }

  if (isEmpty(changes) && txn.type === TransactionTypes.authorize) {
    const approveInternalTransaction = {
      address_from: transaction.from,
      address_to: transaction.to,
      asset: get(txn, 'meta.asset'),
    };
    internalTransactions = [approveInternalTransaction];
  }

  // logic below: prevent sending a WalletConnect 0 amount to be ignored
  if (
    isEmpty(internalTransactions) &&
    transaction.type === TransactionTypes.execution &&
    txn.direction === 'self'
  ) {
    const ethInternalTransaction = {
      address_from: transaction.from,
      address_to: transaction.to,
      asset: {
        address: 'eth',
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
      value: 0,
    };
    internalTransactions = [ethInternalTransaction];
  }

  if (transaction.type === TransactionTypes.trade) {
    internalTransactions = transformTradeRefund(internalTransactions);
  }
  internalTransactions = internalTransactions.map((internalTxn, index) => {
    const address = toLower(get(internalTxn, 'asset.asset_code'));
    const updatedAsset = {
      address,
      decimals: get(internalTxn, 'asset.decimals'),
      name: get(internalTxn, 'asset.name'),
      symbol: toUpper(get(internalTxn, 'asset.symbol') || ''),
      ...tokenOverrides[address],
    };
    const priceUnit =
      internalTxn.price || get(internalTxn, 'asset.price.value') || 0;
    const valueUnit = internalTxn.value || 0;
    const nativeDisplay = convertRawAmountToNativeDisplay(
      valueUnit,
      updatedAsset.decimals,
      priceUnit,
      nativeCurrency
    );

    if (includes(purchaseTransactions, toLower(transaction.hash))) {
      transaction.type = TransactionTypes.purchase;
    }

    const status = getTransactionLabel({
      direction: internalTxn.direction || txn.direction,
      pending: transaction.pending,
      protocol: transaction.protocol,
      status: transaction.status,
      type: transaction.type,
    });

    const title = getTitle({
      protocol: transaction.protocol,
      status,
      type: transaction.type,
    });

    const description = getDescription({
      name: updatedAsset.name,
      status,
      type: transaction.type,
    });

    return {
      ...transaction,
      address: toChecksumAddress(updatedAsset.address),
      balance: convertRawAmountToBalance(valueUnit, updatedAsset),
      description,
      from: internalTxn.address_from,
      hash: `${transaction.hash}-${index}`,
      name: updatedAsset.name,
      native: nativeDisplay,
      status,
      symbol: updatedAsset.symbol,
      title,
      to: internalTxn.address_to,
    };
  });

  return reverse(internalTransactions);
};

export const dedupePendingTransactions = (
  accountAddress,
  pendingTransactions,
  parsedTransactions
) => {
  let updatedPendingTransactions = pendingTransactions;
  if (pendingTransactions.length) {
    updatedPendingTransactions = filter(
      updatedPendingTransactions,
      pendingTxn => {
        const matchingElement = find(
          parsedTransactions,
          txn =>
            txn.hash &&
            (startsWith(toLower(txn.hash), toLower(pendingTxn.hash)) ||
              (toLower(txn.from) === toLower(accountAddress) &&
                txn.nonce &&
                txn.nonce >= pendingTxn.nonce))
        );
        return !matchingElement;
      }
    );
  }
  return updatedPendingTransactions;
};

export const getTitle = ({ protocol, status, type }) => {
  if (type === TransactionTypes.deposit || type === TransactionTypes.withdraw) {
    if (
      status === TransactionStatusTypes.deposited ||
      status === TransactionStatusTypes.withdrew ||
      status === TransactionStatusTypes.sent ||
      status === TransactionStatusTypes.received
    ) {
      if (protocol === ProtocolTypes.compound.name) {
        return 'Savings';
      } else {
        return get(ProtocolTypes, `${protocol}.displayName`);
      }
    }
  }
  return upperFirst(status);
};

export const getDescription = ({ name, status, type }) => {
  switch (type) {
    case TransactionTypes.deposit:
      return status === TransactionStatusTypes.depositing ||
        status === TransactionStatusTypes.sending
        ? name
        : `Deposited ${name}`;
    case TransactionTypes.withdraw:
      return status === TransactionStatusTypes.withdrawing ||
        status === TransactionStatusTypes.receiving
        ? name
        : `Withdrew ${name}`;
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
}) => {
  if (pending && type === TransactionTypes.purchase)
    return TransactionStatusTypes.purchasing;

  const isFromAccount = direction === DirectionTypes.out;
  const isToAccount = direction === DirectionTypes.in;
  const isSelf = direction === DirectionTypes.self;

  if (pending && type === TransactionTypes.authorize)
    return TransactionStatusTypes.approving;

  if (pending && type === TransactionTypes.deposit) {
    if (protocol === ProtocolTypes.compound.name) {
      return TransactionStatusTypes.depositing;
    } else {
      return TransactionStatusTypes.sending;
    }
  }

  if (pending && type === TransactionTypes.withdraw) {
    if (protocol === ProtocolTypes.compound.name) {
      return TransactionStatusTypes.withdrawing;
    } else {
      return TransactionStatusTypes.receiving;
    }
  }

  if (pending && isFromAccount) return TransactionStatusTypes.sending;
  if (pending && isToAccount) return TransactionStatusTypes.receiving;

  if (status === TransactionStatusTypes.failed)
    return TransactionStatusTypes.failed;

  if (type === TransactionTypes.trade && isFromAccount)
    return TransactionStatusTypes.swapped;

  if (type === TransactionTypes.authorize)
    return TransactionStatusTypes.approved;
  if (type === TransactionTypes.purchase)
    return TransactionStatusTypes.purchased;

  if (type === TransactionTypes.deposit) {
    if (protocol === ProtocolTypes.compound.name) {
      return TransactionStatusTypes.deposited;
    } else {
      return TransactionStatusTypes.sent;
    }
  }

  if (type === TransactionTypes.withdraw) {
    if (protocol === ProtocolTypes.compound.name) {
      return TransactionStatusTypes.withdrew;
    } else {
      return TransactionStatusTypes.received;
    }
  }

  if (isSelf) return TransactionStatusTypes.self;

  if (isFromAccount) return TransactionStatusTypes.sent;
  if (isToAccount) return TransactionStatusTypes.received;

  return TransactionStatusTypes.unknown;
};
