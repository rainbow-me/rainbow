import smartContractMethods from 'balance-common/src/references/smartcontract-methods.json';
import BigNumber from 'bignumber.js';
import {
  convertAssetAmountToDisplaySpecific,
  convertAssetAmountToNativeValue,
  convertHexToString,
  formatInputDecimals,
  fromWei,
} from 'balance-common';
import { mapValues, omit } from 'lodash';
import {
  getAccountLocalRequests,
  removeLocalRequest,
  updateLocalRequests,
} from '../model/localstorage';

// -- Constants --------------------------------------- //
const WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE = 'wallet/WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE';

export const transactionsToApproveInit = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().account;
  getAccountLocalRequests(accountAddress, network).then((requests) => {
    const transactionsToApprove = requests || {};
    dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: transactionsToApprove });
  })
};

const getAssetDetails = (contractAddress, assets) => {
  for (var item of assets)  {
    if (item.address === contractAddress) {
      return { ...item }
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
    return convertAssetAmountToDisplaySpecific(_nativeAmount, prices, nativeCurrency);
  }

  return _nativeAmount;
};

const getTransactionDisplayDetails = (transaction, assets, prices, nativeCurrency) => {
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
  const timestampInMs = Date.now();
  if (transaction.data === '0x') {
    const value = fromWei(convertHexToString(transaction.value));
    const nativeAmount = getNativeAmount(prices, nativeCurrency, value, 'ETH');
    return {
      asset: {
        address: null,
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
      from: transaction.from,
      gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
      gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
      nativeAmount,
      nonce: Number(convertHexToString(transaction.nonce)),
      timestampInMs,
      to: transaction.to,
      value,
    };
  } else if (transaction.data.startsWith(tokenTransferHash)) {
    const contractAddress = transaction.to;
    const asset = getAssetDetails(contractAddress, assets);
    const dataPayload = transaction.data.replace(tokenTransferHash, '');
    const toAddress = `0x${dataPayload.slice(0, 64).replace(/^0+/, '')}`;
    const amount = `0x${dataPayload.slice(64, 128).replace(/^0+/, '')}`;
    const value = fromWei(convertHexToString(amount), asset.decimals);
    const nativeAmount = getNativeAmount(prices, nativeCurrency, value, asset.symbol);
    return {
      asset,
      from: transaction.from,
      gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
      gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
      nativeAmount,
      nonce: Number(convertHexToString(transaction.nonce)),
      timestampInMs,
      to: toAddress,
      value,
    };
  }

  console.log('This type of transaction is currently not supported.');
  return null;
};

export const addTransactionToApprove = (sessionId, transactionId, callData, dappName) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountInfo, accountAddress, network, prices, nativeCurrency } = getState().account;
  const transactionDisplayDetails = getTransactionDisplayDetails(callData, accountInfo.assets, prices, nativeCurrency);
  const transaction = { sessionId, transactionId, callData, transactionDisplayDetails, dappName };
  const updatedTransactions = { ...transactionsToApprove, [transactionId]: transaction };
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
  updateLocalRequests(accountAddress, network, updatedTransactions);
  return transaction;
};

export const addTransactionsToApprove = (transactions) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountInfo, accountAddress, network, prices, nativeCurrency } = getState().account;
  const transactionsWithDisplayDetails = mapValues(transactions, (transactionDetails) => {
    const transactionDisplayDetails = getTransactionDisplayDetails(transactionDetails.callData, accountInfo.assets, prices, nativeCurrency);
    return { ...transactionDetails, transactionDisplayDetails };
  });
  const updatedTransactions = { ...transactionsToApprove, ...transactionsWithDisplayDetails };
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
  updateLocalRequests(accountAddress, network, updatedTransactions);
};

export const transactionIfExists = (transactionId) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  return (transactionsToApprove && transactionsToApprove[transactionId]);
};

export const removeTransaction = (transactionId) => (dispatch, getState) => {
  const { accountAddress, network } = getState().account;
  const { transactionsToApprove } = getState().transactionsToApprove;
  const updatedTransactions = omit(transactionsToApprove, [transactionId]);
  removeLocalRequest(accountAddress, network, transactionId);
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
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
