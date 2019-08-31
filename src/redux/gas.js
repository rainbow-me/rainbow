import { get, isEmpty } from 'lodash';
import { apiGetGasPrices } from '../handlers/gasPrices';
import { estimateGasLimit } from '../handlers/web3';
import { fromWei } from '../helpers/utilities';
import {
  getFallbackGasPrices,
  parseGasPrices,
  parseTxFees,
} from '../parsers/gas';
import ethUnits from '../references/ethereum-units.json';
import { ethereumUtils } from '../utils';

// -- Constants ------------------------------------------------------------- //

const GAS_PRICES_REQUEST = 'gas/GAS_PRICES_REQUEST';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_PRICES_FAILURE = 'gas/GAS_PRICES_FAILURE';

const GAS_UPDATE_TX_FEE_SUCCESS = 'gas/GAS_UPDATE_TX_FEE_SUCCESS';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';
const GAS_CLEAR_FIELDS = 'gas/GAS_CLEAR_FIELDS';
const GAS_CLEAR_TXN_SPECIFIC_FIELDS = 'gas/GAS_CLEAR_TXN_SPECIFIC_FIELDS';

// -- Actions --------------------------------------------------------------- //
let getGasPricesInterval = null;

const getEthPriceUnit = (assets) => {
  const ethAsset = ethereumUtils.getAsset(assets);
  return get(ethAsset, 'price.value', 0);
};

export const gasPricesInit = () => (dispatch, getState) => new Promise((resolve, reject) => {
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
  dispatch({
    payload: {
      gasPrices: fallbackGasPrices,
      selectedGasPrice,
    },
    type: GAS_PRICES_REQUEST,
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

export const gasUpdateGasPriceOption = (newGasPriceOption) => (dispatch) => {
  dispatch({
    payload: newGasPriceOption,
    type: GAS_UPDATE_GAS_PRICE_OPTION,
  });
};

export const gasUpdateGasPrice = (address, amount, asset, recipient) => (dispatch, getState) => {
  const { gasPrices, selectedGasPriceOption } = getState().gas;
  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;
  const ethAsset = ethereumUtils.getAsset(assets);
  if (isEmpty(asset)) return;
  if (isEmpty(gasPrices)) return;
  estimateGasLimit({
    address,
    amount,
    asset,
    recipient,
  })
    .then(gasLimit => {
      const ethPriceUnit = getEthPriceUnit(assets);
      const txFees = parseTxFees(gasPrices, ethPriceUnit, gasLimit, nativeCurrency);
      const txFee = txFees[selectedGasPriceOption];
      const balanceAmount = get(ethAsset, 'balance.amount', 0);
      const txFeeAmount = fromWei(get(txFee, 'value.amount', 0));
      const selectedGasPrice = {
        ...txFee,
        ...gasPrices[selectedGasPriceOption],
      };
      dispatch({
        payload: {
          gasLimit,
          isSufficientGas: Number(balanceAmount) > Number(txFeeAmount),
          selectedGasPrice,
          txFees,
        },
        type: GAS_UPDATE_TX_FEE_SUCCESS,
      });
    })
    .catch(error => {
    });
};

export const resetGasTxFees = () => (dispatch) => {
  dispatch({ type: GAS_CLEAR_TXN_SPECIFIC_FIELDS });
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
  case GAS_PRICES_REQUEST:
    return {
      ...state,
      fetchingGasPrices: true,
      gasPrices: action.payload.gasPrices,
      selectedGasPrice: action.payload.selectedGasPrice,
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
  case GAS_UPDATE_TX_FEE_SUCCESS:
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
      selectedGasPriceOption: action.payload,
    };
  case GAS_CLEAR_FIELDS:
    return { ...state, ...INITIAL_STATE };
  case GAS_CLEAR_TXN_SPECIFIC_FIELDS: {
    return {
      ...INITIAL_STATE,
      fetchingGasPrices: state.fetchingGasPrices,
      gasPrices: state.gasPrices,
    };
  }
  default:
    return state;
  }
};
