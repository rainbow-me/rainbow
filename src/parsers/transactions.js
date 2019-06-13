import {
  flatten,
  get,
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
  let transaction = pick(txn, ['hash', 'nonce', 'protocol', 'status', 'mined_at']);
  transaction['pending'] = false;
  const changes = get(txn, 'changes', []);
  const internalTransactions = changes.map((internalTxn, index) => {
    const symbol = get(internalTxn, 'asset.symbol', '');
    const updatedAsset = {
      ...internalTxn.asset,
      symbol: symbol.toUpperCase(),
    };
    const priceUnit = internalTxn.price || 0;
    const nativeDisplay = convertRawAmountToNativeDisplay(
      internalTxn.value,
      internalTxn.asset.decimals,
      priceUnit,
      nativeCurrency
    );

    return {
      ...transaction,
      asset: updatedAsset,
      balance: convertRawAmountToBalance(internalTxn.value, updatedAsset),
      hash: `${transaction.hash}-${index}`,
      from: internalTxn.address_from,
      native: nativeDisplay,
      to: internalTxn.address_to,
    };
  });
  return reverse(internalTransactions);
};
