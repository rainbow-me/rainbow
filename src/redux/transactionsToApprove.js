import smartContractMethods from 'balance-common/src/references/smartcontract-methods.json';
import BigNumber from 'bignumber.js';
import {
  convertAssetAmountToDisplaySpecific,
  convertAssetAmountToNativeValue,
  convertHexToString,
  formatInputDecimals,
  fromWei,
} from 'balance-common';
import { get, mapValues, omit } from 'lodash';
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
  let nativeAmount = '';
  let nativeAmountDisplay = '';
  if (prices && prices[nativeCurrency] && prices[nativeCurrency][symbol]) {
    nativeAmount = convertAssetAmountToNativeValue(
      assetAmount,
      { symbol },
      prices,
    );
    const _nativeAmount = formatInputDecimals(nativeAmount, assetAmount);
    nativeAmountDisplay = convertAssetAmountToDisplaySpecific(_nativeAmount, prices, nativeCurrency);
    return {
      nativeAmount,
      nativeAmountDisplay,
    };
  }

  return { nativeAmount, nativeAmountDisplay };
};

const getRequestDisplayDetails = (callData, assets, prices, nativeCurrency) => {
  /*
   * eth_accounts
   * eth_signTransaction
   * eth_sendRawTransaction
   * eth_signTypedData
   */
  if (callData.method === 'eth_sendTransaction') {
    const transaction = get(callData, 'params[0]', null);
    return getTransactionDisplayDetails(transaction, assets, prices, nativeCurrency);
  } else if (callData.method === 'eth_sign' || callData.method === 'personal_sign') {
    const message = get(callData, 'params[1]');
    return getMessageDisplayDetails(message);
  } else if (callData.method === 'eth_signTypedData' ||
             callData.method === 'eth_signTypedData_v3') {
    console.log('callData signed typed data', callData);
    return null;
  }
  //callData.method === 'eth_signTypedData_v1' ||
  return null;
};

const getMessageDisplayDetails = (message) => {
  const timestampInMs = Date.now();
  return {
    payload: message,
    timestampInMs,
    type: 'message',
  };
};

const getTransactionDisplayDetails = (transaction, assets, prices, nativeCurrency) => {
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
  const timestampInMs = Date.now();
  if (transaction.data === '0x') {
    const value = fromWei(convertHexToString(transaction.value));
    const { nativeAmount, nativeAmountDisplay } = getNativeAmount(prices, nativeCurrency, value, 'ETH');
    return {
      payload: {
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
        nativeAmountDisplay,
        nonce: Number(convertHexToString(transaction.nonce)),
        to: transaction.to,
        value,
      },
      timestampInMs,
      type: 'transaction',
    };
  } else if (transaction.data.startsWith(tokenTransferHash)) {
    const contractAddress = transaction.to;
    const asset = getAssetDetails(contractAddress, assets);
    const dataPayload = transaction.data.replace(tokenTransferHash, '');
    const toAddress = `0x${dataPayload.slice(0, 64).replace(/^0+/, '')}`;
    const amount = `0x${dataPayload.slice(64, 128).replace(/^0+/, '')}`;
    const value = fromWei(convertHexToString(amount), asset.decimals);
    const { nativeAmount, nativeAmountDisplay } = getNativeAmount(prices, nativeCurrency, value, asset.symbol);
    return {
      payload: {
        asset,
        from: transaction.from,
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
        nativeAmount,
        nativeAmountDisplay,
        nonce: Number(convertHexToString(transaction.nonce)),
        to: toAddress,
        value,
      },
      timestampInMs,
      type: 'transaction',
    };
  }

  console.log('This type of transaction is currently not supported.');
  return null;
};

export const addTransactionToApprove = (sessionId, callId, callData, dappName) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountInfo, accountAddress, network, prices, nativeCurrency } = getState().account;
  const transactionDisplayDetails = getRequestDisplayDetails(callData, accountInfo.assets, prices, nativeCurrency);
  const transaction = { sessionId, callId, callData, transactionDisplayDetails, dappName };
  const updatedTransactions = { ...transactionsToApprove, [callId]: transaction };
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
  updateLocalRequests(accountAddress, network, updatedTransactions);
  return transaction;
};

export const addTransactionsToApprove = (transactions) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountInfo, accountAddress, network, prices, nativeCurrency } = getState().account;
  const transactionsWithDisplayDetails = mapValues(transactions, (transactionDetails) => {
    const transactionDisplayDetails = getRequestDisplayDetails(transactionDetails.callData, accountInfo.assets, prices, nativeCurrency);
    return { ...transactionDetails, transactionDisplayDetails };
  });
  const updatedTransactions = { ...transactionsToApprove, ...transactionsWithDisplayDetails };
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
  updateLocalRequests(accountAddress, network, updatedTransactions);
};

export const transactionIfExists = (callId) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  return (transactionsToApprove && transactionsToApprove[callId]);
};

export const removeTransaction = (callId) => (dispatch, getState) => {
  const { accountAddress, network } = getState().account;
  const { transactionsToApprove } = getState().transactionsToApprove;
  const updatedTransactions = omit(transactionsToApprove, [callId]);
  removeLocalRequest(accountAddress, network, callId);
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
