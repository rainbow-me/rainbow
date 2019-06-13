import { add, convertNumberToString } from '../helpers/utilities';

/**
 * @desc returns an object
 * @param  {Array} assets
 * @param  {String} assetAmount
 * @param  {String} gasPrice
 * @return {Object} ethereum, balanceAmount, balance, requestedAmount, txFeeAmount, txFee, amountWithFees
 */
export const transactionData = (assets, assetAmount, gasPrice) => {
  const ethereum = getEth(assets);
  const balance = ethereum.balance.amount;
  const requestedAmount = convertNumberToString(assetAmount);
  const txFee = gasPrice.txFee.value.amount;
  const amountWithFees = add(requestedAmount, txFee);

  return {
    ethereum,
    balance,
    requestedAmount,
    txFee,
    amountWithFees,
  };
};

export default {
  transactionData,
};
