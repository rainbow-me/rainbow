import { get, isEmpty } from 'lodash';
import { apiGetGasPrices } from '../handlers/gasPrices';
import { fromWei } from '../helpers/utilities';
import {
  getFallbackGasPrices,
  parseGasPrices,
  parseTxFees,
} from '../parsers/gas';
import ethUnits from '../references/ethereum-units.json';
import { ethereumUtils } from '../utils';

// -- Constants ------------------------------------------------------------- //

const GAS_PRICES_DEFAULT = 'gas/GAS_PRICES_DEFAULT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_PRICES_FAILURE = 'gas/GAS_PRICES_FAILURE';

const GAS_UPDATE_TX_FEE = 'gas/GAS_UPDATE_TX_FEE';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';
const GAS_CLEAR_FIELDS = 'gas/GAS_CLEAR_FIELDS';
const GAS_RESET_FIELDS = 'gas/GAS_RESET_FIELDS';

// -- Actions --------------------------------------------------------------- //
let getGasPricesInterval = null;

const getEthPriceUnit = (assets) => {
  const ethAsset = ethereumUtils.getAsset(assets);
  return get(ethAsset, 'price.value', 0);
};

const getDefaultTxFees = () => (dispatch, getState) => {
  const { assets } = getState().data;
  const { gasLimit } = getState().gas;
  const { nativeCurrency } = getState().settings;
  const fallbackGasPrices = getFallbackGasPrices();
  const ethPriceUnit = getEthPriceUnit(assets);
  const txFees = parseTxFees(fallbackGasPrices, ethPriceUnit, gasLimit, nativeCurrency);
  const selectedGasPrice = {
    ...txFees.average,
    ...fallbackGasPrices.average,
  };
  return {
    fallbackGasPrices,
    selectedGasPrice,
    txFees,
  };
};

export const gasPricesInit = () => (dispatch, getState) => new Promise((resolve, reject) => {
  const { fallbackGasPrices, selectedGasPrice, txFees } = dispatch(getDefaultTxFees());
  dispatch({
    payload: {
      gasPrices: fallbackGasPrices,
      selectedGasPrice,
      txFees,
    },
    type: GAS_PRICES_DEFAULT,
  });

  const getGasPrices = () => new Promise((fetchResolve, fetchReject) => {
    const { useShortGasFormat } = getState().gas;
    apiGetGasPrices()
      .then(({ data }) => {
        const gasPrices = parseGasPrices(
          data,
          useShortGasFormat,
        );
        dispatch({
          payload: gasPrices,
          type: GAS_PRICES_SUCCESS,
        });
        fetchResolve(true);
      })
      .catch(error => {
        console.error(error);
        dispatch({
          payload: fallbackGasPrices,
          type: GAS_PRICES_FAILURE,
        });
        fetchReject(error);
      });
  });
  return getGasPrices().then(() => {
    clearInterval(getGasPricesInterval);
    getGasPricesInterval = setInterval(getGasPrices, 15000); // 15 secs
    resolve(true);
  }).catch(error => {
    clearInterval(getGasPricesInterval);
    getGasPricesInterval = setInterval(getGasPrices, 15000); // 15 secs
    reject(error);
  });
});

export const gasUpdateGasPriceOption = (newGasPriceOption) => (dispatch, getState) => {
  const { gasPrices, txFees } = getState().gas;
  if (isEmpty(gasPrices)) return;
  const { assets } = getState().data;
  const results = getSelectedGasPrice(assets, gasPrices, txFees, newGasPriceOption);
  dispatch({
    payload: {
      ...results,
      selectedGasPriceOption: newGasPriceOption,
    },
    type: GAS_UPDATE_GAS_PRICE_OPTION,
  });
};

export const gasUpdateTxFee = (gasLimit) => (dispatch, getState) => {
  const { gasPrices, selectedGasPriceOption } = getState().gas;
  if (isEmpty(gasPrices)) return;
  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;
  const ethPriceUnit = getEthPriceUnit(assets);
  const txFees = parseTxFees(gasPrices, ethPriceUnit, gasLimit, nativeCurrency);
  const results = getSelectedGasPrice(assets, gasPrices, txFees, selectedGasPriceOption);
  dispatch({
    payload: {
      ...results,
      gasLimit,
      txFees,
    },
    type: GAS_UPDATE_TX_FEE,
  });
};

const getSelectedGasPrice = (assets, gasPrices, txFees, selectedGasPriceOption) => {
  const txFee = txFees[selectedGasPriceOption];
  const ethAsset = ethereumUtils.getAsset(assets);
  const balanceAmount = get(ethAsset, 'balance.amount', 0);
  const txFeeAmount = fromWei(get(txFee, 'value.amount', 0));
  return ({
    isSufficientGas: Number(balanceAmount) > Number(txFeeAmount),
    selectedGasPrice: {
      ...txFee,
      ...gasPrices[selectedGasPriceOption],
    },
  });
};

export const resetGasTxFees = () => (dispatch) => {
  const { selectedGasPrice, txFees } = dispatch(getDefaultTxFees());
  dispatch({
    payload: {
      selectedGasPrice,
      txFees,
    },
    type: GAS_RESET_FIELDS,
  });
};

export const gasClearFields = () => (dispatch) => {
  clearInterval(getGasPricesInterval);
  dispatch({ type: GAS_CLEAR_FIELDS });
};

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE = {
  fetchingGasPrices: false,
  gasLimit: ethUnits.basic_tx,
  gasPrices: {},
  isSufficientGas: false,
  selectedGasPrice: {},
  selectedGasPriceOption: 'average',
  txFees: {},
  useShortGasFormat: true,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case GAS_PRICES_DEFAULT:
    return {
      ...state,
      fetchingGasPrices: true,
      gasPrices: action.payload.gasPrices,
      selectedGasPrice: action.payload.selectedGasPrice,
      txFees: action.payload.txFees,
    };
  case GAS_PRICES_SUCCESS:
    return {
      ...state,
      fetchingGasPrices: false,
      gasPrices: action.payload,
    };
  case GAS_PRICES_FAILURE:
    return {
      ...state,
      fetchingGasPrices: false,
      gasPrices: action.payload,
    };
  case GAS_UPDATE_TX_FEE:
    return {
      ...state,
      gasLimit: action.payload.gasLimit,
      isSufficientGas: action.payload.isSufficientGas,
      selectedGasPrice: action.payload.selectedGasPrice,
      txFees: action.payload.txFees,
    };
  case GAS_UPDATE_GAS_PRICE_OPTION:
    return {
      ...state,
      isSufficientGas: action.payload.isSufficientGas,
      selectedGasPrice: action.payload.selectedGasPrice,
      selectedGasPriceOption: action.payload.selectedGasPriceOption,
    };
  case GAS_RESET_FIELDS: {
    return {
      ...INITIAL_STATE,
      fetchingGasPrices: state.fetchingGasPrices,
      gasPrices: state.gasPrices,
      selectedGasPrice: action.payload.selectedGasPrice,
      selectedGasPriceOption: state.selectedGasPriceOption,
      txFees: action.payload.txFees,
    };
  }
  default:
    return state;
  }
};
