import { get, pick } from 'lodash';
import { getTransactionCount } from '../handlers/web3';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
} from '../helpers/utilities';
import { getDescription, getTitle } from './transactions';

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
  let tx = pick(txDetails, [
    'dappName',
    'from',
    'nonce',
    'to',
    'sourceAmount',
    'transferId',
    'type',
  ]);
  const hash = txDetails.hash ? `${txDetails.hash}-0` : null;
  const nonce = tx.nonce || (tx.from ? await getTransactionCount(tx.from) : '');
  const status = txDetails?.status || TransactionStatusTypes.sending;

  const title = getTitle({
    protocol: txDetails?.protocol,
    status,
    type: txDetails?.type,
  });

  const description = getDescription({
    name: txDetails?.asset?.name,
    status,
    type: txDetails?.type,
  });

  tx = {
    ...tx,
    balance,
    description,
    gasLimit: txDetails?.gasLimit,
    gasPrice: txDetails?.gasPrice,
    hash,
    minedAt: null,
    name: txDetails?.asset?.name,
    native,
    nonce,
    pending: true,
    protocol: txDetails?.protocol,
    status,
    symbol: txDetails?.asset?.symbol,
    title,
    type: txDetails?.type,
  };

  return tx;
};
