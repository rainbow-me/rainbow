import { get, isEmpty } from 'lodash';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountFromNativeValue,
  formatInputDecimals,
} from '../helpers/utilities';
import { createSignableTransaction } from '../handlers/web3';
import { ethereumUtils } from '../utils';
import { dataAddNewTransaction } from './data';

// -- Constants ------------------------------------------------------------- //

const SEND_MODAL_INIT = 'send/SEND_MODAL_INIT';

const SEND_TRANSACTION_REQUEST = 'send/SEND_TRANSACTION_REQUEST';
const SEND_TRANSACTION_SUCCESS = 'send/SEND_TRANSACTION_SUCCESS';
const SEND_TRANSACTION_FAILURE = 'send/SEND_TRANSACTION_FAILURE';

const SEND_TOGGLE_CONFIRMATION_VIEW = 'send/SEND_TOGGLE_CONFIRMATION_VIEW';

const SEND_UPDATE_NATIVE_AMOUNT = 'send/SEND_UPDATE_NATIVE_AMOUNT';

const SEND_UPDATE_RECIPIENT = 'send/SEND_UPDATE_RECIPIENT';
const SEND_UPDATE_ASSET_AMOUNT = 'send/SEND_UPDATE_ASSET_AMOUNT';
const SEND_UPDATE_SELECTED = 'send/SEND_UPDATE_SELECTED';
const SEND_UPDATE_NFT_SELECTED = 'send/SEND_UPDATE_NFT_SELECTED';

const SEND_CLEAR_FIELDS = 'send/SEND_CLEAR_FIELDS';

// -- Actions --------------------------------------------------------------- //

export const sendModalInit = (options = {}) => (dispatch, getState) => {
  const { accountAddress } = getState().settings;
  const { assets } = getState().data;
  const selected =
    assets.filter(asset => asset.address === options.defaultAsset)[0] || {};
  dispatch({
    payload: {
      address: accountAddress,
      selected,
    },
    type: SEND_MODAL_INIT,
  });
};

export const sendTransaction = (
  transactionDetails,
  signAndSendTransactionCb
) => (dispatch, getState) =>
  new Promise((resolve, reject) => {
    dispatch({ type: SEND_TRANSACTION_REQUEST });
    const {
      address,
      recipient,
      amount,
      asset,
      gasPrice,
      gasLimit,
    } = transactionDetails;
    const { accountType } = getState().settings;
    const txDetails = {
      amount,
      asset,
      from: address,
      gasLimit,
      gasPrice: gasPrice.value.amount,
      nonce: null,
      to: recipient,
    };
    return createSignableTransaction(txDetails)
      .then(signableTransactionDetails => {
        signAndSendTransactionCb({
          accountType,
          transaction: signableTransactionDetails,
        })
          .then(txHash => {
            if (!isEmpty(txHash)) {
              txDetails.hash = txHash;
              dispatch(dataAddNewTransaction(txDetails))
                .then(() => {
                  dispatch({
                    payload: txHash,
                    type: SEND_TRANSACTION_SUCCESS,
                  });
                  resolve(txHash);
                })
                .catch(error => {
                  reject(error);
                });
            } else {
              dispatch({ type: SEND_TRANSACTION_FAILURE });
              reject(new Error('No transaction hash.'));
            }
          })
          .catch(error => {
            dispatch({ type: SEND_TRANSACTION_FAILURE });
            reject(error);
          });
      })
      .catch(error => {
        dispatch({ type: SEND_TRANSACTION_FAILURE });
        reject(error);
      });
  });

export const sendToggleConfirmationView = boolean => (dispatch, getState) => {
  let confirm = boolean;
  if (!confirm) {
    confirm = !getState().send.confirm;
  }
  dispatch({
    payload: confirm,
    type: SEND_TOGGLE_CONFIRMATION_VIEW,
  });
};

export const sendUpdateRecipient = recipient => dispatch =>
  dispatch({
    payload: recipient,
    type: SEND_UPDATE_RECIPIENT,
  });

export const sendUpdateAssetAmount = assetAmount => (dispatch, getState) => {
  const { nativeCurrency } = getState().settings;
  const { selected } = getState().send;
  const { selectedGasPrice } = getState().gas;
  const _assetAmount = assetAmount.replace(/[^0-9.]/g, '');
  let _nativeAmount = '';
  if (_assetAmount.length) {
    const priceUnit = get(selected, 'price.value', 0);
    const { amount: nativeAmount } = convertAmountAndPriceToNativeDisplay(
      _assetAmount,
      priceUnit,
      nativeCurrency
    );
    _nativeAmount = formatInputDecimals(nativeAmount, _assetAmount);
  }
  const balanceAmount = ethereumUtils.getBalanceAmount(
    selectedGasPrice,
    selected
  );
  dispatch({
    payload: {
      assetAmount: _assetAmount,
      isSufficientBalance: Number(_assetAmount) <= Number(balanceAmount),
      nativeAmount: _nativeAmount,
    },
    type: SEND_UPDATE_ASSET_AMOUNT,
  });
};

export const sendUpdateNativeAmount = nativeAmount => (dispatch, getState) => {
  const { selected } = getState().send;
  const { selectedGasPrice } = getState().gas;
  const _nativeAmount = nativeAmount.replace(/[^0-9.]/g, '');
  let _assetAmount = '';
  if (_nativeAmount.length) {
    const priceUnit = get(selected, 'price.value', 0);
    const assetAmount = convertAmountFromNativeValue(
      _nativeAmount,
      priceUnit,
      selected.decimals
    );
    _assetAmount = formatInputDecimals(assetAmount, _nativeAmount);
  }

  const balanceAmount = ethereumUtils.getBalanceAmount(
    selectedGasPrice,
    selected
  );

  dispatch({
    payload: {
      assetAmount: _assetAmount,
      isSufficientBalance: Number(_assetAmount) <= Number(balanceAmount),
      nativeAmount: _nativeAmount,
    },
    type: SEND_UPDATE_ASSET_AMOUNT,
  });
};

export const sendUpdateSelected = asset => (dispatch, getState) => {
  if (get(asset, 'isNft')) {
    dispatch({
      payload: {
        selected: {
          ...asset,
          symbol: asset.asset_contract.name,
        },
      },
      type: SEND_UPDATE_NFT_SELECTED,
    });
  } else {
    const state = getState();
    const assetAmount = get(state, 'send.assetAmount');
    dispatch({
      payload: asset,
      type: SEND_UPDATE_SELECTED,
    });
    dispatch(sendUpdateAssetAmount(assetAmount));
  }
};

export const sendMaxBalance = () => (dispatch, getState) => {
  const { selected } = getState().send;
  const { selectedGasPrice } = getState().gas;
  const balanceAmount = ethereumUtils.getBalanceAmount(
    selectedGasPrice,
    selected
  );
  dispatch(sendUpdateAssetAmount(balanceAmount));
};

export const sendClearFields = () => ({ type: SEND_CLEAR_FIELDS });

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE = {
  address: '',
  assetAmount: '',
  confirm: false,
  fetching: false,
  isSufficientBalance: false,
  nativeAmount: '',
  recipient: '',
  selected: {},
  txHash: '',
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SEND_MODAL_INIT:
      return {
        ...state,
        address: action.payload.address,
        selected: action.payload.selected,
      };
    case SEND_TRANSACTION_REQUEST:
      return { ...state, fetching: true };
    case SEND_TRANSACTION_SUCCESS:
      return {
        ...state,
        fetching: false,
        txHash: action.payload,
      };
    case SEND_TRANSACTION_FAILURE:
      return {
        ...state,
        confirm: false,
        fetching: false,
        txHash: '',
      };
    case SEND_TOGGLE_CONFIRMATION_VIEW:
      return { ...state, confirm: action.payload };
    case SEND_UPDATE_RECIPIENT:
      return { ...state, recipient: action.payload };
    case SEND_UPDATE_NATIVE_AMOUNT:
    case SEND_UPDATE_ASSET_AMOUNT:
      return {
        ...state,
        assetAmount: action.payload.assetAmount,
        isSufficientBalance: action.payload.isSufficientBalance,
        nativeAmount: action.payload.nativeAmount,
      };
    case SEND_UPDATE_SELECTED:
      return { ...state, selected: action.payload };
    case SEND_UPDATE_NFT_SELECTED:
      return {
        ...state,
        assetAmount: '1',
        isSufficientBalance: true,
        selected: action.payload.selected,
      };
    case SEND_CLEAR_FIELDS:
      return { ...state, ...INITIAL_STATE };
    default:
      return state;
  }
};
