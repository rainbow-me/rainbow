import BigNumber from 'bignumber.js';
import {
  find,
  get,
  mapValues,
  omit,
} from 'lodash';
import {
  convertAssetAmountToDisplaySpecific,
  convertAssetAmountToNativeValue,
  convertHexToString,
  formatInputDecimals,
  fromWei,
} from '@rainbow-me/rainbow-common';
import smartContractMethods from '@rainbow-me/rainbow-common/src/references/smartcontract-methods.json';
import {
  getLocalRequests,
  removeLocalRequest,
  saveLocalRequests,
} from '../model/localstorage';

// -- Constants --------------------------------------- //
const WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE = 'wallet/WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE';

export const transactionsToApproveInit = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  getLocalRequests(accountAddress, network).then((requests) => {
    const transactionsToApprove = requests || {};
    dispatch({ payload: transactionsToApprove, type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE });
  });
};

const getAssetDetails = (contractAddress, assets) => find(assets, (item) => item.address === contractAddress);

export const getNativeAmount = (prices, nativeCurrency, assetAmount, symbol) => {
  let nativeAmount = '';
  let nativeAmountDisplay = '';
  if (prices && prices[nativeCurrency] && prices[nativeCurrency][symbol]) {
    nativeAmount = convertAssetAmountToNativeValue(
      assetAmount,
      { symbol },
      prices,
      nativeCurrency,
    );
    const _nativeAmount = formatInputDecimals(nativeAmount, assetAmount);
    nativeAmountDisplay = convertAssetAmountToDisplaySpecific(_nativeAmount, nativeCurrency);
    return {
      nativeAmount,
      nativeAmountDisplay,
    };
  }

  return { nativeAmount, nativeAmountDisplay };
};

const getRequestDisplayDetails = (callData, assets, prices, nativeCurrency) => {
  if (callData.method === 'eth_sendTransaction') {
    const transaction = get(callData, 'params[0]', null);
    return getTransactionDisplayDetails(transaction, assets, prices, nativeCurrency);
  }
  if (callData.method === 'eth_sign' || callData.method === 'personal_sign') {
    const message = get(callData, 'params[1]');
    return getMessageDisplayDetails(message);
  }
  if (callData.method === 'eth_signTypedData'
      || callData.method === 'eth_signTypedData_v3') {
    const request = get(callData, 'params[1]', null);
    const jsonRequest = JSON.stringify(request.message);
    return getTypedDataDisplayDetails(jsonRequest);
  }
  return null;
};

const getTypedDataDisplayDetails = (request) => {
  const timestampInMs = Date.now();
  return {
    payload: request,
    timestampInMs,
    type: 'message',
  };
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
  }
  if (transaction.data.startsWith(tokenTransferHash)) {
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

  return null;
};

export const addTransactionToApprove = (sessionId, callId, callData, dappName) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountAddress, network, nativeCurrency } = getState().settings;
  const { prices } = getState().prices;
  const { assets } = getState().assets;
  const transactionDisplayDetails = getRequestDisplayDetails(callData, assets, prices, nativeCurrency);
  const transaction = {
    callData,
    callId,
    dappName,
    sessionId,
    transactionDisplayDetails,
  };
  const updatedTransactions = { ...transactionsToApprove, [callId]: transaction };
  dispatch({ payload: updatedTransactions, type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE });
  saveLocalRequests(accountAddress, network, updatedTransactions);
  return transaction;
};

export const addTransactionsToApprove = (transactions) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountAddress, network, nativeCurrency } = getState().settings;
  const { prices } = getState().prices;
  const { assets } = getState().assets;
  const transactionsWithDisplayDetails = mapValues(transactions, (transactionDetails) => {
    const transactionDisplayDetails = getRequestDisplayDetails(transactionDetails.callData, assets, prices, nativeCurrency);
    return { ...transactionDetails, transactionDisplayDetails };
  });
  const updatedTransactions = { ...transactionsToApprove, ...transactionsWithDisplayDetails };
  dispatch({ payload: updatedTransactions, type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE });
  saveLocalRequests(accountAddress, network, updatedTransactions);
};

export const transactionIfExists = (callId) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  return (transactionsToApprove && transactionsToApprove[callId]);
};

export const removeTransaction = (callId) => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { transactionsToApprove } = getState().transactionsToApprove;
  const updatedTransactions = omit(transactionsToApprove, [callId]);
  removeLocalRequest(accountAddress, network, callId);
  dispatch({ payload: updatedTransactions, type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE });
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
