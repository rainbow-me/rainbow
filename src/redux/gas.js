import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { get, isEmpty } from 'lodash';
import { apiGetGasPrices } from '../handlers/gasPrices';
import { fromWei, greaterThanOrEqualTo } from '../helpers/utilities';
import {
  getFallbackGasPrices,
  parseGasPrices,
  parseTxFees,
} from '../parsers/gas';
import ethUnits from '../references/ethereum-units.json';
import { ethereumUtils, gasUtils } from '../utils';

// -- Constants ------------------------------------------------------------- //
const GAS_MULTIPLIER = 1.101;
const GAS_UPDATE_DEFAULT_GAS_LIMIT = 'gas/GAS_UPDATE_DEFAULT_GAS_LIMIT';
const GAS_PRICES_DEFAULT = 'gas/GAS_PRICES_DEFAULT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_PRICES_FAILURE = 'gas/GAS_PRICES_FAILURE';

const GAS_UPDATE_TX_FEE = 'gas/GAS_UPDATE_TX_FEE';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';

// -- Actions --------------------------------------------------------------- //
let gasPricesHandle = null;

const getDefaultTxFees = () => (dispatch, getState) => {
  const { assets } = getState().data;
  const { defaultGasLimit } = getState().gas;
  const { nativeCurrency } = getState().settings;
  const fallbackGasPrices = getFallbackGasPrices();
  const ethPriceUnit = ethereumUtils.getEthPriceUnit(assets);
  const txFees = parseTxFees(
    fallbackGasPrices,
    ethPriceUnit,
    defaultGasLimit,
    nativeCurrency
  );
  const selectedGasPrice = {
    ...txFees[gasUtils.NORMAL],
    ...fallbackGasPrices[gasUtils.NORMAL],
  };
  return {
    fallbackGasPrices,
    selectedGasPrice,
    txFees,
  };
};

export const gasPricesStartPolling = () => async (dispatch, getState) => {
  const { fallbackGasPrices, selectedGasPrice, txFees } = dispatch(
    getDefaultTxFees()
  );

  dispatch({
    payload: {
      gasPrices: fallbackGasPrices,
      selectedGasPrice,
      txFees,
    },
    type: GAS_PRICES_DEFAULT,
  });

  const getGasPrices = () =>
    new Promise((fetchResolve, fetchReject) => {
      const { useShortGasFormat } = getState().gas;
      apiGetGasPrices()
        .then(({ data }) => {
          const adjustedGasPrices = bumpGasPrices(data);
          let gasPrices = parseGasPrices(adjustedGasPrices, useShortGasFormat);
          dispatch({
            payload: gasPrices,
            type: GAS_PRICES_SUCCESS,
          });
          fetchResolve(true);
        })
        .catch(error => {
          dispatch({
            payload: fallbackGasPrices,
            type: GAS_PRICES_FAILURE,
          });
          captureException(error);
          fetchReject(error);
        });
    });

  const watchGasPrices = async () => {
    gasPricesHandle && clearTimeout(gasPricesHandle);
    try {
      await getGasPrices();
      // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      gasPricesHandle = setTimeout(watchGasPrices, 15000); // 15 secs
    }
  };

  watchGasPrices();
};

export const gasUpdateGasPriceOption = newGasPriceOption => (
  dispatch,
  getState
) => {
  const { gasPrices, txFees } = getState().gas;
  if (isEmpty(gasPrices)) return;
  const { assets } = getState().data;
  const results = getSelectedGasPrice(
    assets,
    gasPrices,
    txFees,
    newGasPriceOption
  );
  dispatch({
    payload: {
      ...results,
      selectedGasPriceOption: newGasPriceOption,
    },
    type: GAS_UPDATE_GAS_PRICE_OPTION,
  });
  analytics.track('Updated Gas Price', { gasPriceOption: newGasPriceOption });
};

export const gasUpdateDefaultGasLimit = (
  defaultGasLimit = ethUnits.basic_tx
) => dispatch => {
  dispatch({
    payload: defaultGasLimit,
    type: GAS_UPDATE_DEFAULT_GAS_LIMIT,
  });
  dispatch(gasUpdateTxFee(defaultGasLimit));
};

export const gasUpdateTxFee = (gasLimit, overrideGasOption) => (
  dispatch,
  getState
) => {
  const { defaultGasLimit, gasPrices, selectedGasPriceOption } = getState().gas;
  const _gasLimit = gasLimit || defaultGasLimit;
  const _selectedGasPriceOption = overrideGasOption || selectedGasPriceOption;
  if (isEmpty(gasPrices)) return;
  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;
  const ethPriceUnit = ethereumUtils.getEthPriceUnit(assets);
  const txFees = parseTxFees(
    gasPrices,
    ethPriceUnit,
    _gasLimit,
    nativeCurrency
  );

  const results = getSelectedGasPrice(
    assets,
    gasPrices,
    txFees,
    _selectedGasPriceOption
  );
  dispatch({
    payload: {
      ...results,
      gasLimit,
      txFees,
    },
    type: GAS_UPDATE_TX_FEE,
  });
};

const getSelectedGasPrice = (
  assets,
  gasPrices,
  txFees,
  selectedGasPriceOption
) => {
  const txFee = txFees[selectedGasPriceOption];
  const ethAsset = ethereumUtils.getAsset(assets);
  const balanceAmount = get(ethAsset, 'balance.amount', 0);
  const txFeeAmount = fromWei(get(txFee, 'txFee.value.amount', 0));
  return {
    isSufficientGas: greaterThanOrEqualTo(balanceAmount, txFeeAmount),
    selectedGasPrice: {
      ...txFee,
      ...gasPrices[selectedGasPriceOption],
    },
  };
};

const bumpGasPrices = data => {
  const processedData = { ...data };
  const gasPricesKeys = ['average', 'fast', 'fastest', 'safeLow'];
  Object.keys(processedData).forEach(key => {
    if (gasPricesKeys.indexOf(key) !== -1) {
      processedData[key] = (
        parseFloat(processedData[key]) * GAS_MULTIPLIER
      ).toFixed(2);
    }
  });
  return processedData;
};

export const gasPricesStopPolling = () => () => {
  gasPricesHandle && clearTimeout(gasPricesHandle);
};

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE = {
  defaultGasLimit: ethUnits.basic_tx,
  gasLimit: null,
  gasPrices: {},
  isSufficientGas: false,
  selectedGasPrice: {},
  selectedGasPriceOption: gasUtils.NORMAL,
  txFees: {},
  useShortGasFormat: true,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case GAS_UPDATE_DEFAULT_GAS_LIMIT:
      return {
        ...state,
        defaultGasLimit: action.payload,
      };
    case GAS_PRICES_DEFAULT:
      return {
        ...state,
        gasPrices: action.payload.gasPrices,
        selectedGasPrice: action.payload.selectedGasPrice,
        txFees: action.payload.txFees,
      };
    case GAS_PRICES_SUCCESS:
      return {
        ...state,
        gasPrices: action.payload,
      };
    case GAS_PRICES_FAILURE:
      return {
        ...state,
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
    default:
      return state;
  }
};
