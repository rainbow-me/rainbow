import smartContractMethods from 'balance-common/src/references/smartcontract-methods.json';
import { bignumber } from 'balance-common';

export const getTransactionDisplayDetails = transaction => {
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
  if (transaction.data == '0x') {
    console.log('should be just eth transfer');
    return {
      from: transaction.from,
      to: transaction.to,
      symbol: 'ETH',
      value: bignumber.fromWeiToEther(bignumber.convertHexToString(transaction.value)),
    }
  } else if (transaction.data.startsWith(tokenTransferHash)) {
    /*
    const contractAddress = transaction.to;
    const assetDetails = assetDetails(contractAddress); // TODO run through list of existing assets
    const transactionPaylaod = transaction.data.replace(tokenTransferHash, '');
    const toAddress = transactionPayload; // TODO get the actual to address
    const transferValue = divide(unhex(transactionPayload), assetDetails.decimals);
    return {
      from: transaction.from,
      to: toAddress,
      symbol: assetDetails.symbol,
      value: transferValue,
    }
  */
    return null;
  } else {
    console.log('This type of transaction is currently not supported.');
    return null;
  }
};

/*
 * token: 
 *   actual value should be:  unHex the string, divide by 10^decimals
 *   to: smart contract address 
*/

/**
 * @desc ellipse text to max maxLength
 * @param  {String}  [text = '']
 * @param  {Number}  [maxLength = 9999]
 * @return {Intercom}
 */
export const ellipseText = (text = '', maxLength = 9999) => {
  if (text.length <= maxLength) return text;
  const _maxLength = maxLength - 3;
  let ellipse = false;
  let currentLength = 0;
  const result = `${text
    .split(' ')
    .filter(word => {
      currentLength += word.length;
      if (ellipse || currentLength >= _maxLength) {
        ellipse = true;
        return false;
      }
      return true;
    })
    .join(' ')}...`;
  return result;
};

/**
 * @desc ellipse text to max maxLength
 * @param  {String}  [text = '']
 * @param  {Number}  [maxLength = 9999]
 * @return {Intercom}
 */
export const ellipseAddress = (text = '') => {
  const addressArr = text.split('');
  const firstFour = text.split('', 4).join('');
  const lastFour = addressArr
    .reverse()
    .join('')
    .split('', 4)
    .reverse()
    .join('');
  const result = `${firstFour}...${lastFour}`;
  return result;
};
