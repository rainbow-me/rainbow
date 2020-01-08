import {
  compact,
  concat,
  filter,
  find,
  findIndex,
  flatten,
  get,
  isEmpty,
  partition,
  pick,
  reverse,
  slice,
  startsWith,
  toLower,
  toUpper,
  uniqBy,
} from 'lodash';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import {
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
} from '../helpers/utilities';
import { isLowerCaseMatch } from '../utils';

const DIRECTION_OUT = 'out';

const dataFromLastTxHash = (transactionData, transactions) => {
  const lastSuccessfulTxn = find(transactions, txn => txn.hash && !txn.pending);
  const lastTxHash = lastSuccessfulTxn ? lastSuccessfulTxn.hash : '';
  if (lastTxHash) {
    const lastTxnHashIndex = findIndex(transactionData, txn =>
      lastTxHash.startsWith(txn.hash)
    );
    if (lastTxnHashIndex > -1) {
      return slice(transactionData, 0, lastTxnHashIndex);
    }
  }
  return transactionData;
};

export default (
  transactionData,
  accountAddress,
  nativeCurrency,
  existingTransactions,
  tokenOverrides,
  appended = false
) => {
  const data = appended
    ? dataFromLastTxHash(transactionData, existingTransactions)
    : transactionData;
  const parsedNewTransactions = flatten(
    data.map(txn =>
      parseTransaction(txn, accountAddress, nativeCurrency, tokenOverrides)
    )
  );
  const [pendingTransactions, remainingTransactions] = partition(
    existingTransactions,
    txn => txn.pending
  );
  const [approvalTransactions, parsedTransactions] = partition(
    parsedNewTransactions,
    txn => txn.type === 'authorize'
  );
  const updatedPendingTransactions = dedupePendingTransactions(
    pendingTransactions,
    parsedTransactions
  );
  const updatedResults = concat(
    updatedPendingTransactions,
    parsedTransactions,
    remainingTransactions
  );
  const dedupedResults = uniqBy(updatedResults, txn => txn.hash);
  return { approvalTransactions, dedupedResults };
};

const transformUniswapRefund = internalTransactions => {
  const [txnsOut, txnsIn] = partition(
    internalTransactions,
    txn => txn.direction === DIRECTION_OUT
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
  tokenOverrides
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
  if (
    isEmpty(changes) &&
    txn.status === 'failed' &&
    txn.type === 'execution' &&
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
  if (isEmpty(changes) && txn.type === 'authorize') {
    const approveInternalTransaction = {
      address_from: transaction.from,
      address_to: transaction.to,
      asset: get(txn, 'meta.asset'),
    };
    internalTransactions = [approveInternalTransaction];
  }
  // logic below: prevent sending yourself money to be seen as a trade
  if (
    changes.length === 2 &&
    get(changes, '[0].asset.asset_code') ===
      get(changes, '[1].asset.asset_code')
  ) {
    internalTransactions = [changes[0]];
  }
  // logic below: prevent sending a WalletConnect 0 amount to be seen as a Cancel
  if (isEmpty(internalTransactions) && transaction.type === 'cancel') {
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
  if (transaction.type === 'trade' && transaction.protocol === 'uniswap') {
    internalTransactions = transformUniswapRefund(internalTransactions);
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
    const priceUnit = internalTxn.price || 0;
    const valueUnit = internalTxn.value || 0;
    const nativeDisplay = convertRawAmountToNativeDisplay(
      valueUnit,
      updatedAsset.decimals,
      priceUnit,
      nativeCurrency
    );

    const status = getTransactionLabel(
      accountAddress,
      internalTxn.address_from,
      transaction.pending,
      transaction.status,
      internalTxn.address_to
    );

    return {
      ...transaction,
      balance: convertRawAmountToBalance(valueUnit, updatedAsset),
      from: internalTxn.address_from,
      hash: `${transaction.hash}-${index}`,
      name: updatedAsset.name,
      native: nativeDisplay,
      status,
      symbol: updatedAsset.symbol,
      to: internalTxn.address_to,
    };
  });
  return reverse(internalTransactions);
};

const dedupePendingTransactions = (pendingTransactions, parsedTransactions) => {
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
              (txn.nonce && txn.nonce >= pendingTxn.nonce))
        );
        return !matchingElement;
      }
    );
  }
  return updatedPendingTransactions;
};

const getTransactionLabel = (accountAddress, from, pending, status, to) => {
  const isFromAccount = isLowerCaseMatch(from, accountAddress);
  const isToAccount = isLowerCaseMatch(to, accountAddress);

  if (pending && isFromAccount) return TransactionStatusTypes.sending;
  if (pending && isToAccount) return TransactionStatusTypes.receiving;

  if (status === 'failed') return TransactionStatusTypes.failed;

  if (isFromAccount && isToAccount) return TransactionStatusTypes.self;

  if (isFromAccount) return TransactionStatusTypes.sent;
  if (isToAccount) return TransactionStatusTypes.received;

  return TransactionStatusTypes.unknown;
};
