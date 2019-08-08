import { get, isEmpty } from 'lodash';
import { apiGetGasPrices } from '../handlers/api';
import ethUnits from '../references/ethereum-units.json';
import { dataAddNewTransaction } from './data';
import { ethereumUtils } from '../utils';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountFromNativeValue,
  formatInputDecimals,
  fromWei,
} from '../helpers/utilities';
import {
  parseGasPrices,
  parseGasPricesTxFee,
} from '../parsers/gas';
import {
  createSignableTransaction,
  estimateGasLimit,
} from '../handlers/web3';

// -- Constants ------------------------------------------------------------- //

const SEND_GET_GAS_PRICES_REQUEST = 'send/SEND_GET_GAS_PRICES_REQUEST';
const SEND_GET_GAS_PRICES_SUCCESS = 'send/SEND_GET_GAS_PRICES_SUCCESS';
const SEND_GET_GAS_PRICES_FAILURE = 'send/SEND_GET_GAS_PRICES_FAILURE';

const SEND_UPDATE_GAS_PRICE_REQUEST = 'send/SEND_UPDATE_GAS_PRICE_REQUEST';
const SEND_UPDATE_GAS_PRICE_SUCCESS = 'send/SEND_UPDATE_GAS_PRICE_SUCCESS';
const SEND_UPDATE_GAS_PRICE_FAILURE = 'send/SEND_UPDATE_GAS_PRICE_FAILURE';

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
const getEthPriceUnit = (assets) => {
  const ethAsset = ethereumUtils.getAsset(assets);
  return get(ethAsset, 'price.value', 0);
};

export const sendModalInit = (options = {}) => (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const { assets } = getState().data;
  const { gasLimit } = getState().send;
  const ethPriceUnit = getEthPriceUnit(assets);

  const fallbackGasPrices = parseGasPrices(null, ethPriceUnit, gasLimit, nativeCurrency, options.gasFormat === 'short');
  const selected = assets.filter(asset => asset.address === options.defaultAsset)[0] || {};

  dispatch({
    payload: {
      address: accountAddress,
      gasPrices: fallbackGasPrices,
      selected,
    },
    type: SEND_GET_GAS_PRICES_REQUEST,
  });

  apiGetGasPrices()
    .then(({ data }) => {
      const gasPrices = parseGasPrices(data, ethPriceUnit, gasLimit, nativeCurrency, options.gasFormat === 'short');
      dispatch({
        payload: gasPrices,
        type: SEND_GET_GAS_PRICES_SUCCESS,
      });
    })
    .catch(error => {
      console.error(error);

      dispatch({
        payload: fallbackGasPrices,
        type: SEND_GET_GAS_PRICES_FAILURE,
      });
    });
};

export const sendUpdateGasPrice = newGasPriceOption => (dispatch, getState) => {
  const {
    selected,
    address,
    recipient,
    assetAmount,
    gasPrice,
    gasPrices: existingGasPrices,
    gasPriceOption,
    fetchingGasPrices,
  } = getState().send;
  if (isEmpty(selected)) return;
  if (fetchingGasPrices) return;
  let gasPrices = existingGasPrices;
  if (!Object.keys(gasPrices).length) return;
  const _gasPriceOption = newGasPriceOption || gasPriceOption;
  let _gasPrice = _gasPriceOption ? gasPrices[_gasPriceOption] : gasPrice;
  dispatch({ type: SEND_UPDATE_GAS_PRICE_REQUEST });
  estimateGasLimit({
    address,
    amount: assetAmount,
    asset: selected,
    recipient,
  })
    .then(gasLimit => {
      const { assets } = getState().data;
      const { nativeCurrency } = getState().settings;
      const ethPriceUnit = getEthPriceUnit(assets);
      gasPrices = parseGasPricesTxFee(gasPrices, ethPriceUnit, gasLimit, nativeCurrency);
      _gasPrice = gasPriceOption ? gasPrices[_gasPriceOption] : gasPrice;

      const ethereum = ethereumUtils.getAsset(assets);
      const balanceAmount = get(ethereum, 'balance.amount', 0);
      const txFeeAmount = fromWei(get(_gasPrice, 'txFee.value.amount', 0));

      dispatch({
        payload: {
          gasLimit,
          gasPrice: _gasPrice,
          gasPriceOption: _gasPriceOption,
          gasPrices,
          isSufficientGas: Number(balanceAmount) > Number(txFeeAmount),
        },
        type: SEND_UPDATE_GAS_PRICE_SUCCESS,
      });
    })
    .catch(error => {
      dispatch({
        payload: {
          gasPrice: _gasPrice,
          gasPriceOption: _gasPriceOption,
          gasPrices,
        },
        type: SEND_UPDATE_GAS_PRICE_FAILURE,
      });
    });
};

export const sendTransaction = (transactionDetails, signAndSendTransactionCb) => (dispatch, getState) => new Promise((resolve, reject) => {
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
        .then((txHash) => {
          if (!isEmpty(txHash)) {
            txDetails.hash = txHash;
            dispatch(dataAddNewTransaction(txDetails))
              .then(success => {
                dispatch({
                  payload: txHash,
                  type: SEND_TRANSACTION_SUCCESS,
                });
                resolve(txHash);
              }).catch(error => {
                reject(error);
              });
          } else {
            dispatch({ type: SEND_TRANSACTION_FAILURE });
            reject(new Error('No transaction hash.'));
          }
        }).catch(error => {
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

export const sendUpdateRecipient = recipient => dispatch => {
  const input = recipient.replace(/[^\w.]/g, '');
  dispatch({
    payload: input,
    type: SEND_UPDATE_RECIPIENT,
  });
};

export const sendUpdateAssetAmount = assetAmount => (dispatch, getState) => {
  const { nativeCurrency } = getState().settings;
  const { gasPrice, selected } = getState().send;
  const _assetAmount = assetAmount.replace(/[^0-9.]/g, '');
  let _nativeAmount = '';
  if (_assetAmount.length) {
    const priceUnit = get(selected, 'price.value', 0);
    const { amount: nativeAmount } = convertAmountAndPriceToNativeDisplay(
      _assetAmount,
      priceUnit,
      nativeCurrency,
    );
    _nativeAmount = formatInputDecimals(nativeAmount, _assetAmount);
  }
  const balanceAmount = ethereumUtils.getBalanceAmount(gasPrice, selected);
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
  const { gasPrice, selected } = getState().send;
  const _nativeAmount = nativeAmount.replace(/[^0-9.]/g, '');
  let _assetAmount = '';
  if (_nativeAmount.length) {
    const priceUnit = get(selected, 'price.value', 0);
    const assetAmount = convertAmountFromNativeValue(
      _nativeAmount,
      priceUnit,
    );
    _assetAmount = formatInputDecimals(assetAmount, _nativeAmount);
  }

  const balanceAmount = ethereumUtils.getBalanceAmount(gasPrice, selected);

  dispatch({
    payload: {
      assetAmount: _assetAmount,
      isSufficientBalance: Number(_assetAmount) <= Number(balanceAmount),
      nativeAmount: _nativeAmount,
    },
    type: SEND_UPDATE_ASSET_AMOUNT,
  });
};

export const sendUpdateSelected = (asset) => (dispatch, getState) => {
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
    dispatch(sendUpdateGasPrice());
  } else {
    const state = getState();
    const assetAmount = get(state, 'send.assetAmount');
    dispatch({
      payload: asset,
      type: SEND_UPDATE_SELECTED,
    });
    dispatch(sendUpdateAssetAmount(assetAmount));
    dispatch(sendUpdateGasPrice());
  }
};

export const sendMaxBalance = () => (dispatch, getState) => {
  const { gasPrice, selected } = getState().send;
  const balanceAmount = ethereumUtils.getBalanceAmount(gasPrice, selected);

  dispatch(sendUpdateAssetAmount(balanceAmount));
  dispatch(sendUpdateGasPrice());
};

export const sendClearFields = () => ({ type: SEND_CLEAR_FIELDS });

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE = {
  address: '',
  assetAmount: '',
  confirm: false,
  fetching: false,
  fetchingGasPrices: false,
  gasLimit: ethUnits.basic_tx,
  gasPrice: {},
  gasPriceOption: 'average',
  gasPrices: {},
  isSufficientBalance: false,
  isSufficientGas: false,
  nativeAmount: '',
  recipient: '',
  selected: {},
  txHash: '',
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SEND_GET_GAS_PRICES_REQUEST:
    return {
      ...state,
      address: action.payload.address,
      fetchingGasPrices: true,
      gasPrice: action.payload.gasPrices.average,
      gasPriceOption: action.payload.gasPrices.average.option,
      gasPrices: action.payload.gasPrices,
      selected: action.payload.selected,
    };
  case SEND_GET_GAS_PRICES_SUCCESS:
    return {
      ...state,
      fetchingGasPrices: false,
      gasPrice: action.payload.average,
      gasPriceOption: action.payload.average.option,
      gasPrices: action.payload,
    };
  case SEND_GET_GAS_PRICES_FAILURE:
    return {
      ...state,
      fetchingGasPrices: false,
      gasPrice: action.payload.average,
      gasPriceOption: action.payload.average.option,
      gasPrices: action.payload,
    };
  case SEND_UPDATE_GAS_PRICE_REQUEST:
    return { ...state, fetchingGasPrices: true };
  case SEND_UPDATE_GAS_PRICE_SUCCESS:
    return {
      ...state,
      fetchingGasPrices: false,
      gasLimit: action.payload.gasLimit,
      gasPrice: action.payload.gasPrice,
      gasPriceOption: action.payload.gasPriceOption,
      gasPrices: action.payload.gasPrices,
      isSufficientGas: action.payload.isSufficientGas,
    };

  case SEND_UPDATE_GAS_PRICE_FAILURE:
    return {
      ...state,
      fetchingGasPrices: false,
      gasPrice: action.payload.gasPrice,
      gasPriceOption: action.payload.gasPriceOption,
      gasPrices: action.payload.gasPrices,
    };
  case SEND_TRANSACTION_REQUEST:
    return { ...state, fetching: true };
  case SEND_TRANSACTION_SUCCESS:
    return {
      ...state,
      fetching: false,
      gasPrices: {},
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
