import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { get, isEmpty } from 'lodash';
import { IS_TESTING } from 'react-native-dotenv';
import {
  etherscanGetGasEstimates,
  etherscanGetGasPrices,
  ethGasStationGetGasPrices,
  getEstimatedTimeForGasPrice,
  polygonGasStationGetGasPrices,
  polygonGetGasEstimates,
} from '@rainbow-me/handlers/gasPrices';
import {
  getProviderForNetwork,
  isHardHat,
  isL2Network,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  defaultGasPriceFormat,
  getFallbackGasPrices,
  parseGasPrices,
  parseTxFees,
  weiToGwei,
} from '@rainbow-me/parsers';
import {
  ARBITRUM_ETH_ADDRESS,
  ETH_ADDRESS,
  ethUnits,
  MATIC_POLYGON_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
} from '@rainbow-me/references';
import { fromWei, greaterThanOrEqualTo, multiply } from '@rainbow-me/utilities';
import { ethereumUtils, gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const { CUSTOM, NORMAL } = gasUtils;

// -- Constants ------------------------------------------------------------- //
const GAS_MULTIPLIER = 1.101;
const GAS_UPDATE_DEFAULT_GAS_LIMIT = 'gas/GAS_UPDATE_DEFAULT_GAS_LIMIT';
const GAS_PRICES_DEFAULT = 'gas/GAS_PRICES_DEFAULT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_PRICES_FAILURE = 'gas/GAS_PRICES_FAILURE';

const GAS_PRICES_RESET = 'gas/GAS_PRICES_RESET';
const GAS_UPDATE_TX_FEE = 'gas/GAS_UPDATE_TX_FEE';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';

// -- Actions --------------------------------------------------------------- //
let gasPricesHandle = null;

const { GAS_PRICE_SOURCES } = gasUtils;

const getDefaultTxFees = () => (dispatch, getState) => {
  const { defaultGasLimit } = getState().gas;
  const { nativeCurrency } = getState().settings;
  const fallbackGasPrices = getFallbackGasPrices();
  const ethPriceUnit = ethereumUtils.getEthPriceUnit();
  const txFees = parseTxFees(
    fallbackGasPrices,
    ethPriceUnit,
    defaultGasLimit,
    nativeCurrency
  );
  const selectedGasPrice = {
    ...txFees[NORMAL],
    ...fallbackGasPrices[NORMAL],
  };
  return {
    fallbackGasPrices,
    selectedGasPrice,
    txFees,
  };
};

export const updateGasPriceForSpeed = (speed, newPrice) => async (
  dispatch,
  getState
) => {
  const { gasPrices } = getState().gas;

  const newGasPrices = { ...gasPrices };
  newGasPrices[speed].value = {
    amount: newPrice,
    display: `${newPrice} Gwei`,
  };

  dispatch({
    payload: {
      gasPrices,
    },
    type: GAS_PRICES_SUCCESS,
  });
};

export const gasPricesStartPolling = (network = networkTypes.mainnet) => async (
  dispatch,
  getState
) => {
  dispatch(gasPricesStopPolling());

  const getPolygonGasPrices = async () => {
    const {
      data: { result },
    } = await polygonGasStationGetGasPrices();
    // Override required to make it compatible with other responses
    const polygonGasStationPrices = {};
    polygonGasStationPrices['slow'] = Math.ceil(Number(result['SafeGasPrice']));
    polygonGasStationPrices['average'] = Math.ceil(result['SafeGasPrice']);
    polygonGasStationPrices['fast'] = Math.ceil(result['ProposeGasPrice']);
    polygonGasStationPrices['fastest'] = Math.ceil(result['FastGasPrice']);

    return polygonGetGasEstimates(polygonGasStationPrices);
  };

  const getArbitrumGasPrices = async () => {
    const provider = await getProviderForNetwork(networkTypes.arbitrum);
    const baseGasPrice = await provider.getGasPrice();
    const baseGasPriceGwei = weiToGwei(baseGasPrice.toString());

    // Node price is super inflated (50%+)
    const fastGasPriceAdjusted = multiply(baseGasPriceGwei, '0.7');
    // Their node adds 10% buffer so -9.9% it's the safe low
    const normalGasPriceAdjusted = multiply(baseGasPriceGwei, '0.5');
    const safeLowGasPriceWithBuffer = multiply(baseGasPriceGwei, '0.4');
    const priceData = {
      average: Number(normalGasPriceAdjusted),
      avgWait: 0.5,
      fast: Number(fastGasPriceAdjusted),
      fastWait: 0.2,
      safeLow: Number(safeLowGasPriceWithBuffer),
      safeLowWait: 1,
    };

    return priceData;
  };

  const getOptimismGasPrices = async () => {
    const provider = await getProviderForNetwork(networkTypes.optimism);
    const baseGasPrice = await provider.getGasPrice();
    const gasPriceGwei = Number(weiToGwei(baseGasPrice.toString()));

    const priceData = {
      average: gasPriceGwei,
      avgWait: 0.5,
      fast: gasPriceGwei,
      fastWait: 0.2,
      safeLow: gasPriceGwei,
      safeLowWait: 1,
    };
    return priceData;
  };

  const getGasPrices = () =>
    new Promise(async (fetchResolve, fetchReject) => {
      try {
        const { gasPrices: existingGasPrice } = getState().gas;

        let adjustedGasPrices;
        let source = GAS_PRICE_SOURCES.ETHERSCAN;
        if (network === networkTypes.polygon) {
          source = GAS_PRICE_SOURCES.POLYGON_GAS_STATION;
          adjustedGasPrices = await getPolygonGasPrices();
        } else if (network === networkTypes.arbitrum) {
          source = GAS_PRICE_SOURCES.ARBITRUM_NODE;
          adjustedGasPrices = await getArbitrumGasPrices();
        } else if (network === networkTypes.optimism) {
          source = GAS_PRICE_SOURCES.OPTIMISM_NODE;
          adjustedGasPrices = await getOptimismGasPrices();
        } else {
          try {
            // Use etherscan as our Gas Price Oracle
            let {
              data: { result: etherscanGasPrices },
            } = await etherscanGetGasPrices();

            // Set a really gas estimate to guarantee that we're gonna be over
            // the basefee at the time we fork mainnet during our hardhat tests
            if (network === networkTypes.mainnet && IS_TESTING === 'true') {
              const providerUrl = web3Provider?.connection?.url;
              if (isHardHat(providerUrl)) {
                etherscanGasPrices = {
                  FastGasPrice: 1000,
                  ProposeGasPrice: 1000,
                  SafeGasPrice: 1000,
                };
              }
            }

            const priceData = {
              average: Number(etherscanGasPrices.ProposeGasPrice),
              fast: Number(etherscanGasPrices.FastGasPrice),
              safeLow: Number(etherscanGasPrices.SafeGasPrice),
            };
            // Add gas estimates
            adjustedGasPrices = await etherscanGetGasEstimates(priceData);
          } catch (e) {
            captureException(new Error('Etherscan gas estimates failed'));
            logger.sentry('Etherscan gas estimates error:', e);
            logger.sentry('falling back to eth gas station');
            source = GAS_PRICE_SOURCES.ETH_GAS_STATION;
            // Fallback to ETHGasStation if Etherscan fails
            const {
              data: ethGasStationPrices,
            } = await ethGasStationGetGasPrices();
            // Only bumping for ETHGasStation
            adjustedGasPrices = bumpGasPrices(ethGasStationPrices);
          }
        }

        let gasPrices = parseGasPrices(adjustedGasPrices, source);
        if (existingGasPrice[CUSTOM] !== null) {
          // Preserve custom values while updating prices
          gasPrices[CUSTOM] = existingGasPrice[CUSTOM];
        }

        dispatch({
          payload: {
            gasPrices,
          },
          type: GAS_PRICES_SUCCESS,
        });

        fetchResolve(true);
      } catch (error) {
        const { fallbackGasPrices } = dispatch(getDefaultTxFees());
        captureException(new Error('all gas estimates failed'));
        logger.sentry('gas estimates error', error);
        dispatch({
          payload: fallbackGasPrices,
          type: GAS_PRICES_FAILURE,
        });
        fetchReject(error);
      }
    });

  const watchGasPrices = async network => {
    try {
      await getGasPrices(network);
      // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      gasPricesHandle = setTimeout(() => {
        watchGasPrices(network);
      }, 15000); // 15 secs
    }
  };

  watchGasPrices(network);
};

export const gasUpdateGasPriceOption = (
  newGasPriceOption,
  network,
  assetsOverride
) => (dispatch, getState) => {
  const { gasPrices, txFees } = getState().gas;
  if (isEmpty(gasPrices)) return;
  const { assets } = getState().data;
  const results = getSelectedGasPrice(
    assetsOverride || assets,
    gasPrices,
    txFees,
    newGasPriceOption,
    network
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

export const gasUpdateCustomValues = (price, network) => async (
  dispatch,
  getState
) => {
  const { gasPrices, gasLimit } = getState().gas;

  const estimateInMinutes = isL2Network(network)
    ? 0.5
    : await getEstimatedTimeForGasPrice(price);
  const newGasPrices = { ...gasPrices };
  newGasPrices[CUSTOM] = defaultGasPriceFormat(
    CUSTOM,
    estimateInMinutes,
    price,
    true
  );

  await dispatch({
    payload: {
      gasPrices: newGasPrices,
    },
    type: GAS_PRICES_SUCCESS,
  });

  dispatch(gasUpdateTxFee(network, gasLimit));
};

export const gasUpdateDefaultGasLimit = (
  network,
  defaultGasLimit = ethUnits.basic_tx
) => dispatch => {
  dispatch({
    payload: defaultGasLimit,
    type: GAS_UPDATE_DEFAULT_GAS_LIMIT,
  });
  dispatch(gasUpdateTxFee(network, defaultGasLimit));
};

export const gasUpdateTxFee = (
  network,
  gasLimit,
  overrideGasOption,
  l1GasFeeOptimism = null
) => (dispatch, getState) => {
  const { defaultGasLimit, gasPrices, selectedGasPriceOption } = getState().gas;
  const _gasLimit = gasLimit || defaultGasLimit;
  const _selectedGasPriceOption = overrideGasOption || selectedGasPriceOption;
  if (isEmpty(gasPrices)) return;
  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;
  let nativeTokenPriceUnit = ethereumUtils.getEthPriceUnit();
  if (network === networkTypes.polygon) {
    nativeTokenPriceUnit = ethereumUtils.getMaticPriceUnit();
  }

  const txFees = parseTxFees(
    gasPrices,
    nativeTokenPriceUnit,
    _gasLimit,
    nativeCurrency,
    l1GasFeeOptimism
  );

  const results = getSelectedGasPrice(
    assets,
    gasPrices,
    txFees,
    _selectedGasPriceOption,
    network
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
  selectedGasPriceOption,
  network
) => {
  let txFee = txFees[selectedGasPriceOption];
  // If no custom price is set we default to FAST
  if (
    selectedGasPriceOption === gasUtils.CUSTOM &&
    get(txFee, 'txFee.value.amount') === 'NaN'
  ) {
    txFee = txFees[gasUtils.FAST];
  }
  let nativeAssetAddress;

  switch (network) {
    case networkTypes.polygon:
      nativeAssetAddress = MATIC_POLYGON_ADDRESS;
      break;
    case networkTypes.arbitrum:
      nativeAssetAddress = ARBITRUM_ETH_ADDRESS;
      break;
    case networkTypes.optimism:
      nativeAssetAddress = OPTIMISM_ETH_ADDRESS;
      break;
    default:
      nativeAssetAddress = ETH_ADDRESS;
  }

  const nativeAsset = ethereumUtils.getAsset(assets, nativeAssetAddress);

  const balanceAmount = get(nativeAsset, 'balance.amount', 0);
  const txFeeAmount = fromWei(get(txFee, 'txFee.value.amount', 0));
  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);

  return {
    isSufficientGas,
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

export const gasPricesStopPolling = () => dispatch => {
  gasPricesHandle && clearTimeout(gasPricesHandle);
  dispatch({
    type: GAS_PRICES_RESET,
  });
};

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE = {
  defaultGasLimit: ethUnits.basic_tx,
  gasLimit: null,
  gasPrices: {},
  isSufficientGas: undefined,
  selectedGasPrice: {},
  selectedGasPriceOption: NORMAL,
  txFees: {},
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
        gasPrices: action.payload.gasPrices,
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
    case GAS_PRICES_RESET:
      return INITIAL_STATE;
    default:
      return state;
  }
};
