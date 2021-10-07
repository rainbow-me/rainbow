import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { get, isEmpty } from 'lodash';
import { AppDispatch, AppGetState } from './store';
import {
  GasFee,
  GasFeeParamsBySpeed,
  GasFeesBlockNativeData,
  GasFeesBySpeed,
  LegacyGasFee,
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  LegacySelectedGasFee,
  SelectedGasFee,
} from '@rainbow-me/entities';
import {
  blockNativeGetGasParams,
  getEstimatedTimeForGasPrice,
  maticGasStationGetGasPrices,
  maticGetGasEstimates,
} from '@rainbow-me/handlers/gasFees';
import {
  getProviderForNetwork,
  isEIP1559LegacyNetwork,
  isL2Network,
} from '@rainbow-me/handlers/web3';
import networkTypes, { Network } from '@rainbow-me/helpers/networkTypes';
import {
  defaultGasPriceFormat,
  getFallbackGasPrices,
  parseEIP1559GasData,
  parseGasFeesBySpeed,
  parseGasPrices,
  parseLegacyGasFeesBySpeed,
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
type Numberish = number | string;

interface GasState {
  defaultGasLimit: number;
  gasLimit: number | null;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
  isSufficientGas: Boolean | null;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed;
  txNetwork: Network | null;
}

// -- Constants ------------------------------------------------------------- //
const OPTIMISM_GAS_PRICE_GWEI = 0.015;
// const GAS_MULTIPLIER = 1.101;
const GAS_UPDATE_DEFAULT_GAS_LIMIT = 'gas/GAS_UPDATE_DEFAULT_GAS_LIMIT';
const GAS_PRICES_DEFAULT = 'gas/GAS_PRICES_DEFAULT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_FEES_SUCCESS = 'gas/GAS_FEES_SUCCESS';
const GAS_PRICES_FAILURE = 'gas/GAS_PRICES_FAILURE';

const GAS_PRICES_RESET = 'gas/GAS_PRICES_RESET';
const GAS_UPDATE_TX_FEE = 'gas/GAS_UPDATE_TX_FEE';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';
const GAS_UPDATE_TRANSACTION_NETWORK = 'gas/GAS_UPDATE_TRANSACTION_NETWORK';

const getnetworkNativeAsset = (assets: any[], network: Network) => {
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
  return nativeAsset;
};

const checkIsSufficientGas = (
  assets: any[],
  txFee: LegacyGasFee | GasFee,
  network: Network
) => {
  const txFeeKey = (txFee as GasFee)?.maxFee ? `maxTxFee` : `txFee`;
  const nativeAsset = getnetworkNativeAsset(assets, network);
  const balanceAmount = get(nativeAsset, 'balance.amount', 0);
  const txFeeAmount = fromWei(get(txFee, `${txFeeKey}.value.amount`, 0));
  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
  return isSufficientGas;
};

const getSelectedGasFee = (
  assets: any[],
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed,
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed,
  selectedGasPriceOption: string,
  network: Network
): {
  isSufficientGas: boolean;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
} => {
  const selectedGasParams = gasFeeParamsBySpeed[selectedGasPriceOption];
  const selectedTxFee = gasFeesBySpeed[selectedGasPriceOption];
  const isSufficientGas = checkIsSufficientGas(assets, selectedTxFee, network);
  // this is going to be undefined on type 0 transactions
  const maxTxFee = get(selectedTxFee, 'maxTxFee');

  return {
    isSufficientGas,
    selectedGasFee: {
      estimatedTime: selectedGasParams.estimatedTime,
      gasFee: { ...selectedTxFee, maxTxFee },
      gasFeeParams: selectedGasParams,
      option: selectedGasPriceOption,
    } as SelectedGasFee | LegacySelectedGasFee,
  };
};

// -- Actions --------------------------------------------------------------- //
let gasPricesHandle: number | null = null;

const { GAS_PRICE_SOURCES } = gasUtils;

// const getDefaultTxFees = () => (
//   dispatch: AppDispatch,
//   getState: AppGetState
// ) => {
//   const { defaultGasLimit } = getState().gas;
//   const { nativeCurrency } = getState().settings;
//   const fallbackGasPrices = getFallbackGasPrices();
//   const ethPriceUnit = ethereumUtils.getEthPriceUnit();
//   const gasFeesBySpeed = parseLegacyGasFeesBySpeed(
//     fallbackGasPrices,
//     ethPriceUnit,
//     defaultGasLimit,
//     nativeCurrency
//   );
//   const selectedGasFee = {
//     ...gasFeesBySpeed[NORMAL],
//     ...fallbackGasPrices[NORMAL],
//   };
//   return {
//     fallbackGasPrices,
//     selectedGasFee,
//     gasFeesBySpeed,
//   };
// };

export const updateGasPriceForSpeed = (
  speed: string,
  newPrice: number
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { gasFeeParamsBySpeed } = getState().gas;

  // TODO handle updates

  const newGasParams = { ...gasFeeParamsBySpeed };
  newGasParams[speed].value = {
    amount: newPrice,
    display: `${newPrice} Gwei`,
  };

  dispatch({
    payload: {
      gasFeeParamsBySpeed,
    },
    type: GAS_PRICES_SUCCESS,
  });
};

export const gasPricesStartPolling = (network = networkTypes.mainnet) => async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  dispatch(gasPricesStopPolling());
  dispatch({
    payload: network,
    type: GAS_UPDATE_TRANSACTION_NETWORK,
  });
  const getPolygonGasPrices = async () => {
    const { data: maticGasStationPrices } = await maticGasStationGetGasPrices();

    // Override required to make it compatible with other responses
    maticGasStationPrices['average'] = maticGasStationPrices['standard'];
    delete maticGasStationPrices.standard;

    return maticGetGasEstimates(maticGasStationPrices);
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
    const priceData = {
      average: OPTIMISM_GAS_PRICE_GWEI,
      avgWait: 0.5,
      fast: OPTIMISM_GAS_PRICE_GWEI,
      fastWait: 0.2,
      safeLow: OPTIMISM_GAS_PRICE_GWEI,
      safeLowWait: 1,
    };
    return priceData;
  };

  const getEIP1559GasParams = async () => {
    const { data } = await blockNativeGetGasParams();
    const gasData = parseEIP1559GasData(data as GasFeesBlockNativeData);
    return gasData;
  };

  const getGasPrices = (network: Network) =>
    new Promise(async (fetchResolve, fetchReject) => {
      try {
        const { gasFeeParamsBySpeed: existingGasFees } = getState().gas;
        const isLegacy = isEIP1559LegacyNetwork(network);
        if (isLegacy) {
          let adjustedGasFees;
          let source = GAS_PRICE_SOURCES.ETHERSCAN;
          if (network === networkTypes.polygon) {
            source = GAS_PRICE_SOURCES.MATIC_GAS_STATION;
            adjustedGasFees = await getPolygonGasPrices();
          } else if (network === networkTypes.arbitrum) {
            source = GAS_PRICE_SOURCES.ARBITRUM_NODE;
            adjustedGasFees = await getArbitrumGasPrices();
          } else if (network === networkTypes.optimism) {
            source = GAS_PRICE_SOURCES.OPTIMISM_NODE;
            adjustedGasFees = await getOptimismGasPrices();
          }
          const gasFeeParamsBySpeed = parseGasPrices(adjustedGasFees, source);
          if (existingGasFees[CUSTOM] !== null) {
            // Preserve custom values while updating prices
            gasFeeParamsBySpeed[CUSTOM] = existingGasFees[CUSTOM];
          }

          dispatch({
            payload: {
              gasFeeParamsBySpeed,
            },
            type: GAS_FEES_SUCCESS,
          });
        } else {
          try {
            // // Use etherscan as our Gas Price Oracle
            // const {
            //   data: { result: etherscanGasPrices },
            // } = await etherscanGetGasPrices();
            const gasFeeParamsBySpeed = await getEIP1559GasParams();
            // const priceData = {
            //   average: Number(etherscanGasPrices.ProposeGasPrice),
            //   fast: Number(etherscanGasPrices.FastGasPrice),
            //   safeLow: Number(etherscanGasPrices.SafeGasPrice),
            // };

            // should add multiplier logic here

            // Add gas estimated times
            // adjustedGasPrices = await etherscanGetGasEstimates(priceData);
            dispatch({
              payload: {
                gasFeeParamsBySpeed,
              },
              type: GAS_FEES_SUCCESS,
            });
          } catch (e) {
            captureException(new Error('Etherscan gas estimates failed'));
            logger.sentry('Etherscan gas estimates error:', e);
            logger.sentry('falling back to eth gas station');
            // source = GAS_PRICE_SOURCES.ETH_GAS_STATION;
            // Fallback to ETHGasStation if Etherscan fails
            // const {
            //   data: ethGasStationPrices,
            // } = await ethGasStationGetGasPrices();
            // // Only bumping for ETHGasStation
            // adjustedGasPrices = bumpGasPrices(ethGasStationPrices);
          }
        }
        fetchResolve(true);
      } catch (error) {
        const fallbackGasPrices = getFallbackGasPrices();
        captureException(new Error('all gas estimates failed'));
        logger.sentry('gas estimates error', error);
        dispatch({
          payload: fallbackGasPrices,
          type: GAS_PRICES_FAILURE,
        });
        fetchReject(error);
      }
    });

  const watchGasPrices = async (network: Network) => {
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

export const gasUpdateGasFeeOption = (
  newGasPriceOption: string,
  network: Network,
  assetsOverride: any[]
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { gasFeeParamsBySpeed, gasFeesBySpeed, txNetwork } = getState().gas;
  const { assets } = getState().data;

  const gasPriceOption = newGasPriceOption || NORMAL;
  if (isEmpty(gasFeeParamsBySpeed)) return;
  const selectedGasFee = getSelectedGasFee(
    assetsOverride || assets,
    gasFeeParamsBySpeed,
    gasFeesBySpeed,
    gasPriceOption,
    txNetwork
  );
  dispatch({
    payload: selectedGasFee,
    type: GAS_UPDATE_GAS_PRICE_OPTION,
  });
  analytics.track('Updated Gas Price', { gasPriceOption: gasPriceOption });
};

export const gasUpdateCustomValues = (
  price: Numberish
  // network: Network
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { gasFeeParamsBySpeed, gasLimit, txNetwork } = getState().gas;

  const estimateInMinutes = isL2Network(txNetwork)
    ? 0.5
    : await getEstimatedTimeForGasPrice(price);
  const newGasPrices = { ...gasFeeParamsBySpeed };
  newGasPrices[CUSTOM] = defaultGasPriceFormat(
    CUSTOM,
    estimateInMinutes,
    price
  );

  await dispatch({
    payload: {
      gasFeeParamsBySpeed: newGasPrices,
    },
    type: GAS_PRICES_SUCCESS,
  });

  dispatch(gasUpdateTxFee(txNetwork, gasLimit));
};

export const gasUpdateDefaultGasLimit = (
  network: Network,
  defaultGasLimit = ethUnits.basic_tx
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { txNetwork } = getState().gas;
  dispatch({
    payload: defaultGasLimit,
    type: GAS_UPDATE_DEFAULT_GAS_LIMIT,
  });
  dispatch(gasUpdateTxFee(txNetwork, defaultGasLimit));
};

export const gasUpdateTxFee = (
  network: Network,
  gasLimit: number,
  overrideGasOption?: string
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    defaultGasLimit,
    gasFeeParamsBySpeed,
    selectedGasFee,
    txNetwork,
  } = getState().gas;
  const _gasLimit = gasLimit || defaultGasLimit;
  const _selectedGasPriceOption =
    overrideGasOption || selectedGasFee.option || NORMAL;

  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;
  const nativeTokenPriceUnit =
    txNetwork !== networkTypes.polygon
      ? ethereumUtils.getEthPriceUnit()
      : ethereumUtils.getMaticPriceUnit();

  const isLegacyNetwork = isEIP1559LegacyNetwork(txNetwork);
  const parseGasFees = isLegacyNetwork
    ? parseLegacyGasFeesBySpeed
    : parseGasFeesBySpeed;

  if (isEmpty(gasFeeParamsBySpeed)) return;

  const gasFeesBySpeed = parseGasFees(
    gasFeeParamsBySpeed,
    nativeTokenPriceUnit,
    _gasLimit,
    nativeCurrency
  );
  const selectedGasParams = getSelectedGasFee(
    assets,
    gasFeeParamsBySpeed,
    gasFeesBySpeed,
    _selectedGasPriceOption,
    txNetwork
  );
  dispatch({
    payload: {
      ...selectedGasParams,
      gasFeesBySpeed,
      gasLimit,
    },
    type: GAS_UPDATE_TX_FEE,
  });
};

// const bumpGasPrices = data => {
//   const processedData = { ...data };
//   const gasPricesKeys = ['average', 'fast', 'fastest', 'safeLow'];
//   Object.keys(processedData).forEach(key => {
//     if (gasPricesKeys.indexOf(key) !== -1) {
//       processedData[key] = (
//         parseFloat(processedData[key]) * GAS_MULTIPLIER
//       ).toFixed(2);
//     }
//   });
//   return processedData;
// };

export const gasPricesStopPolling = () => (dispatch: AppDispatch) => {
  gasPricesHandle && clearTimeout(gasPricesHandle);
  dispatch({
    type: GAS_PRICES_RESET,
  });
};

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE: GasState = {
  defaultGasLimit: ethUnits.basic_tx,
  gasFeeParamsBySpeed: {},
  gasFeesBySpeed: {},
  gasLimit: null,
  isSufficientGas: null,
  selectedGasFee: {} as SelectedGasFee,
  txNetwork: null,
};

export default (
  state = INITIAL_STATE,
  action: { type: string; payload: any }
) => {
  switch (action.type) {
    case GAS_UPDATE_DEFAULT_GAS_LIMIT:
      return {
        ...state,
        defaultGasLimit: action.payload,
      };
    case GAS_PRICES_DEFAULT:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
        gasFeesBySpeed: action.payload.gasFeesBySpeed,
        selectedGasFee: action.payload.selectedGasFee,
      };
    case GAS_PRICES_SUCCESS:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_FEES_SUCCESS:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_PRICES_FAILURE:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_UPDATE_TX_FEE:
      return {
        ...state,
        gasFeesBySpeed: action.payload.gasFeesBySpeed,
        gasLimit: action.payload.gasLimit,
        isSufficientGas: action.payload.isSufficientGas,
        selectedGasFee: action.payload.selectedGasFee,
      };
    case GAS_UPDATE_GAS_PRICE_OPTION:
      return {
        ...state,
        isSufficientGas: action.payload.isSufficientGas,
        selectedGasFee: action.payload.selectedGasFee,
      };
    case GAS_UPDATE_TRANSACTION_NETWORK:
      return {
        ...state,
        txNetwork: action.payload,
      };
    case GAS_PRICES_RESET:
      return INITIAL_STATE;
    default:
      return state;
  }
};
