import {
  flatten,
  get,
  isEmpty,
  pick,
  reverse,
} from 'lodash';
import {
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
} from '../helpers/utilities';

export const parseTransactions = (data, nativeCurrency) => {
  const allTxns = data.map(txn => parseTransaction(txn, nativeCurrency));
  return flatten(allTxns);
};

const parseTransaction = (txn, nativeCurrency) => {
  const transaction = pick(txn, [
    'hash',
    'mined_at',
    'nonce',
    'protocol',
    'status',
    'type',
  ]);
  transaction.pending = false;
  transaction.from = txn.address_from; // eslint-disable-line camelcase
  transaction.to = txn.address_to; // eslint-disable-line camelcase
  const changes = get(txn, 'changes', []);
  let internalTransactions = changes;
  if (changes.length === 2 && get(changes, '[0].asset.asset_code') === get(changes, '[1].asset.asset_code')) {
    internalTransactions = [changes[0]];
  }
  if (isEmpty(internalTransactions) && transaction.type === 'cancel') {
    const ethInternalTransaction = {
      address_from: transaction.from, // eslint-disable-line camelcase
      address_to: transaction.to, // eslint-disable-line camelcase
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
  internalTransactions = internalTransactions.map((internalTxn, index) => {
    const symbol = get(internalTxn, 'asset.symbol') || '';
    const updatedAsset = {
      ...internalTxn.asset,
      symbol: symbol.toUpperCase(),
    };
    const priceUnit = internalTxn.price || 0;
    const nativeDisplay = convertRawAmountToNativeDisplay(
      internalTxn.value,
      internalTxn.asset.decimals,
      priceUnit,
      nativeCurrency,
    );

    return {
      ...transaction,
      asset: updatedAsset,
      balance: convertRawAmountToBalance(internalTxn.value, updatedAsset),
      from: internalTxn.address_from,
      hash: `${transaction.hash}-${index}`,
      native: nativeDisplay,
      to: internalTxn.address_to,
    };
  });
  return reverse(internalTransactions);
};
