import smartContractMethods from 'balance-common/src/references/smartcontract-methods.json';
import {
  convertAssetAmountToDisplaySpecific,
  convertAssetAmountToNativeValue,
  convertHexToString,
  formatInputDecimals,
  fromWei
} from 'balance-common';
import { mapValues } from 'lodash';

// -- Constants --------------------------------------- //
const WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE = 'wallet/WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE';

const getAssetDetails = (contractAddress, assets) => {
  for (var item of assets)  {
    if (item.address === contractAddress) {
      return { symbol: item.symbol, decimals: item.decimals, name: item.name }
    }
  }
  return null;
};

export const getNativeAmount = (prices, nativeCurrency, assetAmount, symbol) => {
  let _nativeAmount = '';
  if (prices && prices[nativeCurrency] && prices[nativeCurrency][symbol]) {
    const nativeAmount = convertAssetAmountToNativeValue(
      assetAmount,
      { symbol },
      prices,
    );
    _nativeAmount = formatInputDecimals(nativeAmount, assetAmount);
    const displayAmount = convertAssetAmountToDisplaySpecific(_nativeAmount, prices, nativeCurrency);
    return displayAmount;
  } else {
    return _nativeAmount;
  } 
};

const getTransactionDisplayDetails = (transactionData, assets, prices, nativeCurrency) => {
  const { transaction, timestamp: timestampInSeconds } = transactionData;
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
  if (transaction.data == '0x') {
    const value = fromWei(convertHexToString(transaction.value));
    const nativeAmount = getNativeAmount(prices, nativeCurrency, value, 'ETH');
    return {
      from: transaction.from,
      gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
      gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
      name: 'Ethereum',
      nativeAmount,
      nonce: Number(convertHexToString(transaction.nonce)),
      symbol: 'ETH',
      timestampInSeconds,
      to: transaction.to,
      value,
    }
  } else if (transaction.data.startsWith(tokenTransferHash)) {
    const contractAddress = transaction.to;
    const { symbol, decimals, name } = getAssetDetails(contractAddress, assets);
    const dataPayload = transaction.data.replace(tokenTransferHash, '');
    const toAddress = '0x' + dataPayload.slice(0, 64).replace(/^0+/, '');
    const amount = '0x' + dataPayload.slice(64,128).replace(/^0+/, '');
    const value = fromWei(convertHexToString(amount), decimals);
    const nativeAmount = getNativeAmount(prices, nativeCurrency, value, symbol);
    return {
      from: transaction.from,
      gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
      gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
      name: name,
      nativeAmount,
      nonce: Number(convertHexToString(transaction.nonce)),
      symbol,
      timestampInSeconds,
      to: toAddress,
      value,
    }
  } else {
    console.log('This type of transaction is currently not supported.');
    return null;
  }
};

export const addTransactionToApprove = (sessionId, transactionId, transactionPayload, dappName) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountInfo, prices, nativeCurrency } = getState().account;
  const transactionDisplayDetails = getTransactionDisplayDetails(transactionPayload, accountInfo.assets, prices, nativeCurrency);
  const transaction = { sessionId, transactionId, transactionPayload, transactionDisplayDetails, dappName };
  const updatedTransactions = { ...transactionsToApprove, transactionId: transaction };
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
  return transaction;
};

export const addTransactionsToApprove = (transactions) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountInfo, prices, nativeCurrency } = getState().account;
  const transactionsWithDisplayDetails = mapValues(transactions, (transactionDetails) => {
    const transactionDisplayDetails = getTransactionDisplayDetails(transactionPayload, accountInfo.assets, prices, nativeCurrency);
    return { ...transactionDetails, transactionDisplayDetails };
  });
  const updatedTransactions = { ...transactionsToApprove, ...transactionsWithDisplayDetails };
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
};

export const transactionIfExists = (transactionId) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  return (transactionsToApprove && transactionsToApprove[transactionId]);
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  fetching: false,
  transactionsToApprove: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE:
      return {
        ...state,
        transactionsToApprove: action.payload,
      };
    default:
      return state;
  }
};
