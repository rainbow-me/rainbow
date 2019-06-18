import { get, pick } from 'lodash';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  multiply,
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
  const amount = txDetails.value;
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
  const nonce =
    txDetails.nonce ||
    (txDetails.from ? await getTransactionCount(txDetails.from) : '');
  let tx = pick(txDetails, [
    'asset',
    'dappName',
    'from',
    'hash',
    'nonce',
    'to',
  ]);
  tx = {
    ...tx,
    balance,
    error: false,
    mined_at: null,
    native,
    pending: txDetails.hash ? true : false,
  };

  return tx;
};
