import { get, pick } from 'lodash';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
} from '../helpers/utilities';
import { getTransactionCount } from '../handlers/web3';

/**
 * @desc parse transactions from native prices
 * @param  {Object} [txDetails=null]
 * @param  {Object} [nativeCurrency='']
 * @return {String}
 */
export const parseNewTransaction = async (
  txDetails = null,
  nativeCurrency = '',
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
    nativeCurrency,
  );
  let tx = pick(txDetails, [
    'asset',
    'dappName',
    'from',
    'hash',
    'nonce',
    'to',
  ]);
  const nonce = tx.nonce
    || (tx.from ? await getTransactionCount(tx.from) : '');
  tx = {
    ...tx,
    balance,
    error: false,
    mined_at: null, // eslint-disable-line camelcase
    native,
    nonce,
    pending: !!txDetails.hash,
  };

  return tx;
};
