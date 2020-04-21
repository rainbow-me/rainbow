import { get, pick } from 'lodash';
import { getTransactionCount } from '../handlers/web3';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
} from '../helpers/utilities';

/**
 * @desc parse transactions from native prices
 * @param  {Object} [txDetails=null]
 * @param  {Object} [nativeCurrency='']
 * @return {String}
 */
export const parseNewTransaction = async (
  txDetails = null,
  nativeCurrency = ''
) => {
  let balance = null;
  const { amount } = txDetails;
  if (amount) {
    balance = {
      amount,
      display: convertAmountToBalanceDisplay(amount, txDetails.asset),
    };
  }
  const native = convertAmountAndPriceToNativeDisplay(
    amount,
    get(txDetails, 'asset.price.value', 0),
    nativeCurrency
  );
  let tx = pick(txDetails, ['dappName', 'from', 'hash', 'nonce', 'to', 'type']);
  const nonce = tx.nonce || (tx.from ? await getTransactionCount(tx.from) : '');
  const status = txDetails.status || TransactionStatusTypes.sending;
  tx = {
    ...tx,
    balance,
    minedAt: null,
    name: get(txDetails, 'asset.name'),
    native,
    nonce,
    pending: !!txDetails.hash,
    status,
    symbol: get(txDetails, 'asset.symbol'),
    type: get(txDetails, 'type'),
  };

  return tx;
};
