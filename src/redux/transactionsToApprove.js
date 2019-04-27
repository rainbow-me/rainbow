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

const getTimestampFromPayload = payload => parseInt(payload.id.toString().slice(0, -3));

const getRequestDisplayDetails = (payload, assets, prices, nativeCurrency) => {
  const timestampInMs = getTimestampFromPayload(payload);
  if (payload.method === 'eth_sendTransaction') {
    const transaction = get(payload, 'params[0]', null);
    return getTransactionDisplayDetails(
      transaction,
      assets,
      prices,
      nativeCurrency,
      timestampInMs,
    );
  }
  if (payload.method === 'eth_sign' || payload.method === 'personal_sign') {
    const message = get(payload, 'params[1]');
    return getMessageDisplayDetails(message, timestampInMs);
  }
  if (payload.method === 'eth_signTypedData'
    || payload.method === 'eth_signTypedData_v3') {
    const request = get(payload, 'params[1]', null);
    const jsonRequest = JSON.stringify(request.message);
    return getTypedDataDisplayDetails(jsonRequest, timestampInMs);
  }
  return null;
};

const getTypedDataDisplayDetails = (request, timestampInMs) => {
  return {
    payload: request,
    timestampInMs,
    type: 'message',
  };
};

const getMessageDisplayDetails = (message, timestampInMs) => {
  return {
    payload: message,
    timestampInMs,
    type: 'message',
  };
};

const getTransactionDisplayDetails = (transaction, assets, prices, nativeCurrency, timestampInMs) => {
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
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
  if (transaction.data) {
    const value = transaction.value ? fromWei(convertHexToString(transaction.value)) : 0;
    return {
      payload: {
        data: transaction.data,
        from: transaction.from,
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
        nonce: Number(convertHexToString(transaction.nonce)),
        to: transaction.to,
        value,
      },
      timestampInMs,
      type: 'default',
    };
  }

  return null;
};

export const addTransactionToApprove = (peerId, requestId, payload, peerMeta) => (dispatch, getState) => {
  const { transactionsToApprove } = getState().transactionsToApprove;
  const { accountAddress, network, nativeCurrency } = getState().settings;
  const { prices } = getState().prices;
  const { assets } = getState().assets;
  const transactionDisplayDetails = getRequestDisplayDetails(payload, assets, prices, nativeCurrency);
  const dappName = peerMeta.name;
  const imageUrl = get(peerMeta, 'icons[0]');
  const transaction = {
    dappName,
    imageUrl,
    payload,
    peerId,
    requestId,
    transactionDisplayDetails,
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
