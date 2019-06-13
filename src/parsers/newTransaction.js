import { multiply, convertAmountToBalanceDisplay } from '../helpers/utilities';
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
  let totalGas =
    txDetails.gasLimit && txDetails.gasPrice
      ? multiply(txDetails.gasLimit, txDetails.gasPrice)
      : null;
  let txFee = totalGas
    ? {
        amount: totalGas,
        display: convertAmountToBalanceDisplay(totalGas, {
          symbol: 'ETH',
          decimals: 18,
        }),
      }
    : null;

  let value = null;
  if (txDetails.amount) {
    const amount = txDetails.amount;
    value = {
      amount,
      display: convertAmountToBalanceDisplay(amount, txDetails.asset),
    };
  }
  const nonce =
    txDetails.nonce ||
    (txDetails.from ? await getTransactionCount(txDetails.from) : '');

  let tx = {
    dappName: txDetails.dappName,
    hash: txDetails.hash,
    timestamp: null,
    from: txDetails.from,
    to: txDetails.to,
    error: false,
    native: {},
    nonce,
    value,
    txFee,
    pending: txDetails.hash ? true : false,
    asset: txDetails.asset,
  };

  return tx;
};
