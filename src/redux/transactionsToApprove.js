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
    dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: transactionsToApprove });
  });
};

const getAssetDetails = (contractAddress, assets) => {
  for (var item of assets) {
    if (item.address === contractAddress) {
      return { ...item };
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

const getRequestDisplayDetails = (payload, assets, prices, nativeCurrency) => {
  if (payload.method === 'eth_sendTransaction') {
    const transaction = get(payload, 'params[0]', null);
    return getTransactionDisplayDetails(transaction, assets, prices, nativeCurrency);
  }
  if (payload.method === 'eth_sign' || payload.method === 'personal_sign') {
    const message = get(payload, 'params[1]');
    return getMessageDisplayDetails(message);
  }
  if (payload.method === 'eth_signTypedData' ||
    payload.method === 'eth_signTypedData_v3') {
    const request = get(payload, 'params[1]', null);
    const jsonRequest = JSON.stringify(request.message);
    return getTypedDataDisplayDetails(jsonRequest);
  }
  return null;
};

const getTypedDataDisplayDetails = (request) => {
  const timestampInMs = Date.now();
  return {
    callData: request,
    timestampInMs,
    type: 'message',
  };
};

const getMessageDisplayDetails = (message) => {
  const timestampInMs = Date.now();
  return {
    callData: message,
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
      callData: {
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
      callData: {
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

export const addTransactionToApprove = (peerId, requestId, payload, dappName) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountAddress, network, nativeCurrency } = getState().settings;
  const { prices } = getState().prices;
  const { assets } = getState().assets;
  const transactionDisplayDetails = getRequestDisplayDetails(payload, assets, prices, nativeCurrency);
  const transaction = {
    peerId,
    requestId,
    payload,
    transactionDisplayDetails,
    dappName,
  };
  const updatedTransactions = { ...transactionsToApprove, [requestId]: transaction };
  dispatch({ type: WALLETCONNECT_UPDATE_TRANSACTIONS_TO_APPROVE, payload: updatedTransactions });
  saveLocalRequests(accountAddress, network, updatedTransactions);
  return transaction;
};

export const transactionIfExists = (requestId) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  return transactionsToApprove && transactionsToApprove[requestId];
};

export const removeTransaction = (requestId) => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { transactionsToApprove } = getState().transactionsToApprove;
  const updatedTransactions = omit(transactionsToApprove, [requestId]);
  removeLocalRequest(accountAddress, network, requestId);
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
