import { convertHexToUtf8 } from '@walletconnect/utils';
import BigNumber from 'bignumber.js';
import {
  filter,
  get,
  omit,
  values,
} from 'lodash';
import {
  getLocalRequests,
  removeLocalRequest,
  removeLocalRequests,
  saveLocalRequests,
} from '../handlers/commonStorage';
import {
  convertAmountAndPriceToNativeDisplay,
  convertHexToString,
  convertRawAmountToDecimalFormat,
  fromWei,
} from '../helpers/utilities';
import smartContractMethods from '../references/smartcontract-methods.json';
import { ethereumUtils } from '../utils';

// -- Constants --------------------------------------- //
const REQUESTS_UPDATE_REQUESTS_TO_APPROVE = 'requests/REQUESTS_UPDATE_REQUESTS_TO_APPROVE';
const REQUESTS_CLEAR_STATE = 'requests/REQUESTS_CLEAR_STATE';

export const requestsLoadState = () => async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  try {
    const requests = await getLocalRequests(accountAddress, network);
    const _requests = requests || {};
    dispatch({ payload: _requests, type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE });
  } catch (error) {
  }
};

const getTimestampFromPayload = payload => parseInt(payload.id.toString().slice(0, -3), 10);

const getRequestDisplayDetails = (payload, assets, nativeCurrency) => {
  const timestampInMs = getTimestampFromPayload(payload);
  if (payload.method === 'eth_sendTransaction') {
    const transaction = get(payload, 'params[0]', null);
    return getTransactionDisplayDetails(
      transaction,
      assets,
      nativeCurrency,
      timestampInMs,
    );
  }
  if (payload.method === 'eth_sign') {
    const message = get(payload, 'params[1]');
    return getMessageDisplayDetails(message, timestampInMs);
  }
  if (payload.method === 'personal_sign') {
    let message = '';
    try {
      message = convertHexToUtf8(get(payload, 'params[0]'));
    } catch (error) {
      message = get(payload, 'params[0]');
    }
    return getMessageDisplayDetails(message, timestampInMs, 'messagePersonal');
  }
  if (payload.method === 'eth_signTypedData'
    || payload.method === 'eth_signTypedData_v3') {
    const request = get(payload, 'params[1]', null);
    const jsonRequest = JSON.stringify(request.message);
    return getMessageDisplayDetails(jsonRequest, timestampInMs);
  }
  return {};
};

const getMessageDisplayDetails = (message, timestampInMs, type = 'message') => ({
  payload: message,
  timestampInMs,
  type,
});

const getTransactionDisplayDetails = (transaction, assets, nativeCurrency, timestampInMs) => {
  const tokenTransferHash = smartContractMethods.token_transfer.hash;
  if (transaction.data === '0x') {
    const value = fromWei(convertHexToString(transaction.value));
    const asset = ethereumUtils.getAsset(assets);
    const priceUnit = get(asset, 'price.value', 0);
    const { amount, display } = convertAmountAndPriceToNativeDisplay(value, priceUnit, nativeCurrency);
    return {
      payload: {
        asset,
        from: transaction.from,
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
        nativeAmount: amount,
        nativeAmountDisplay: display,
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
    const asset = ethereumUtils.getAsset(assets, contractAddress);
    const dataPayload = transaction.data.replace(tokenTransferHash, '');
    const toAddress = `0x${dataPayload.slice(0, 64).replace(/^0+/, '')}`;
    const amount = `0x${dataPayload.slice(64, 128).replace(/^0+/, '')}`;
    const value = convertRawAmountToDecimalFormat(convertHexToString(amount), asset.decimals);
    const priceUnit = get(asset, 'price.value', 0);
    const native = convertAmountAndPriceToNativeDisplay(value, priceUnit, nativeCurrency);
    return {
      payload: {
        asset,
        from: transaction.from,
        gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
        gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
        nativeAmount: native.amount,
        nativeAmountDisplay: native.display,
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

export const addRequestToApprove = (clientId, peerId, requestId, payload, peerMeta) => (dispatch, getState) => {
  const { requests } = getState().requests;
  const { accountAddress, network, nativeCurrency } = getState().settings;
  const { assets } = getState().data;
  const displayDetails = getRequestDisplayDetails(payload, assets, nativeCurrency);
  const dappName = peerMeta.name;
  const imageUrl = get(peerMeta, 'icons[0]');
  const request = {
    clientId,
    dappName,
    displayDetails,
    imageUrl,
    payload,
    peerId,
    requestId,
  };
  const updatedRequests = { ...requests, [requestId]: request };
  dispatch({
    payload: updatedRequests,
    type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
  });
  saveLocalRequests(accountAddress, network, updatedRequests);
  return request;
};

export const requestsForTopic = (topic) => (dispatch, getState) => {
  const { requests } = getState().requests;
  return filter(values(requests), { clientId: topic });
};

export const requestsClearState = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  removeLocalRequests(accountAddress, network);
  dispatch({ type: REQUESTS_CLEAR_STATE });
};

export const removeRequest = (requestId) => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { requests } = getState().requests;
  const updatedRequests = omit(requests, [requestId]);
  removeLocalRequest(accountAddress, network, requestId);
  dispatch({
    payload: updatedRequests,
    type: REQUESTS_UPDATE_REQUESTS_TO_APPROVE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  requests: {},
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case REQUESTS_UPDATE_REQUESTS_TO_APPROVE:
    return {
      ...state,
      requests: action.payload,
    };
  case REQUESTS_CLEAR_STATE:
    return {
      ...state,
      ...INITIAL_STATE,
    };
  default:
    return state;
  }
};
