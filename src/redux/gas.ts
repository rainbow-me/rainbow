import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { get, isEmpty } from 'lodash';
import { AppDispatch, AppGetState } from './store';
import {
  CurrentBlockParams,
  GasFee,
  GasFeeParams,
  GasFeeParamsBySpeed,
  GasFeesBySpeed,
  GasFeesPolygonGasStationData,
  LegacyGasFee,
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  LegacySelectedGasFee,
  RainbowMeteorologyData,
  SelectedGasFee,
} from '@rainbow-me/entities';
import {
  getEstimatedTimeForGasPrice,
  getGasFeesEstimates,
  polygonGasStationGetGasPrices,
  polygonGetGasEstimates,
  rainbowMeteorologyGetData,
} from '@rainbow-me/handlers/gasFees';
import {
  getProviderForNetwork,
  isEIP1559LegacyNetwork,
} from '@rainbow-me/handlers/web3';
import networkTypes, { Network } from '@rainbow-me/helpers/networkTypes';
import {
  defaultGasParamsFormat,
  getFallbackGasPrices,
  parseGasFeeParam,
  parseGasFees,
  parseGasFeesBySpeed,
  parseGasPrices,
  parseLegacyGasFeesBySpeed,
  parseRainbowMeteorologyData,
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

interface GasState {
  defaultGasLimit: number;
  gasLimit: number | null;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
  isSufficientGas: Boolean | null;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed;
  txNetwork: Network | null;
  currentBlockParams: CurrentBlockParams;
}

// -- Constants ------------------------------------------------------------- //
const OPTIMISM_GAS_PRICE_GWEI = 0.015;
// const GAS_MULTIPLIER = 1.101;
const GAS_UPDATE_DEFAULT_GAS_LIMIT = 'gas/GAS_UPDATE_DEFAULT_GAS_LIMIT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_FEES_SUCCESS = 'gas/GAS_FEES_SUCCESS';
const GAS_PRICES_FAILURE = 'gas/GAS_PRICES_FAILURE';
const GAS_PRICES_CUSTOM_UPDATE_FAILURE = 'gas/GAS_PRICES_CUSTOM_UPDATE_FAILURE';

const GAS_PRICES_RESET = 'gas/GAS_PRICES_RESET';
const GAS_UPDATE_TX_FEE = 'gas/GAS_UPDATE_TX_FEE';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';
const GAS_UPDATE_TRANSACTION_NETWORK = 'gas/GAS_UPDATE_TRANSACTION_NETWORK';

const getNetworkNativeAsset = (assets: any[], network: Network) => {
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
  const txFeeKey = (txFee as GasFee)?.maxFee ? `maxFee` : `estimatedFee`;
  const nativeAsset = getNetworkNativeAsset(assets, network);
  const balanceAmount = get(nativeAsset, 'balance.amount', 0);
  const txFeeAmount = fromWei(get(txFee, `${txFeeKey}.value.amount`, 0));
  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
  return isSufficientGas;
};

const getSelectedGasFee = (
  assets: any[],
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed,
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed,
  selectedGasFeeOption: string,
  network: Network
): {
  isSufficientGas: boolean;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
} => {
  const selectedGasParams = gasFeeParamsBySpeed[selectedGasFeeOption];
  const selectedTxFee = gasFeesBySpeed[selectedGasFeeOption];
  const isSufficientGas = checkIsSufficientGas(assets, selectedTxFee, network);
  // this is going to be undefined on type 0 transactions
  const maxFee = get(selectedTxFee, 'maxFee');

  return {
    isSufficientGas,
    selectedGasFee: {
      estimatedTime: selectedGasParams?.estimatedTime,
      gasFee: { ...selectedTxFee, maxFee },
      gasFeeParams: selectedGasParams,
      option: selectedGasFeeOption,
    } as SelectedGasFee | LegacySelectedGasFee,
  };
};

// -- Actions --------------------------------------------------------------- //
let gasPricesHandle: number | null = null;

const { GAS_PRICE_SOURCES } = gasUtils;

/**
 * Used to update the selectedFee when trying to speed up or cancel
 * @param speed
 * @param newMaxPriorityFeePerGas
 */
export const updateGasFeeForSpeed = (
  speed: string,
  newMaxPriorityFeePerGas: number
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { gasFeeParamsBySpeed } = getState().gas;
  const newGasFeeParams = { ...gasFeeParamsBySpeed };
  newGasFeeParams[speed].maxPriorityFeePerGas = parseGasFeeParam(
    newMaxPriorityFeePerGas
  );

  dispatch({
    payload: {
      gasFeeParamsBySpeed: newGasFeeParams,
    },
    type: GAS_PRICES_SUCCESS,
  });
};

export const gasUpdateToCustomGasFee = (gasParams: GasFeeParams) => async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  const {
    txNetwork,
    defaultGasLimit,
    gasFeesBySpeed,
    gasFeeParamsBySpeed,
    gasLimit,
    selectedGasFee,
    currentBlockParams,
  } = getState().gas;
  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;

  const _gasLimit = gasLimit || defaultGasLimit;
  const nativeTokenPriceUnit =
    txNetwork !== networkTypes.polygon
      ? ethereumUtils.getEthPriceUnit()
      : ethereumUtils.getMaticPriceUnit();

  const customGasFees = parseGasFees(
    gasParams,
    currentBlockParams?.baseFeePerGas,
    _gasLimit,
    nativeTokenPriceUnit,
    nativeCurrency
  );
  const newGasFeesBySpeed = { ...gasFeesBySpeed };
  const newGasFeeParamsBySpeed = { ...gasFeeParamsBySpeed };

  newGasFeesBySpeed[CUSTOM] = customGasFees;
  const estimatedTime = await Promise.race([
    await getEstimatedTimeForGasPrice(
      gasParams.maxFeePerGas.gwei + gasParams.maxPriorityFeePerGas.gwei
    ),
    new Promise(res =>
      setTimeout(() => res(selectedGasFee?.estimatedTime?.amount || 45000), 200)
    ),
  ]);
  newGasFeeParamsBySpeed[CUSTOM] = defaultGasParamsFormat(
    CUSTOM,
    estimatedTime,
    gasParams.maxFeePerGas.gwei,
    gasParams.maxPriorityFeePerGas.gwei
  );

  const newSelectedGasFee = getSelectedGasFee(
    assets,
    newGasFeeParamsBySpeed,
    newGasFeesBySpeed,
    CUSTOM,
    txNetwork
  );
  dispatch({
    payload: {
      gasFeeParamsBySpeed: newGasFeeParamsBySpeed,
      gasFeesBySpeed: newGasFeesBySpeed,
      selectedGasFee: newSelectedGasFee.selectedGasFee,
    },
    type: GAS_PRICES_CUSTOM_UPDATE_FAILURE,
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
    const {
      data: { result },
    }: {
      data: GasFeesPolygonGasStationData;
    } = await polygonGasStationGetGasPrices();
    // Override required to make it compatible with other responses
    const polygonGasStationPrices = {
      average: Math.ceil(Number(result['SafeGasPrice'])),
      fast: Math.ceil(Number(result['ProposeGasPrice'])),
      fastest: Math.ceil(Number(result['FastGasPrice'])),
    };
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
    const { data } = (await rainbowMeteorologyGetData()) as {
      data: RainbowMeteorologyData;
    };
    const {
      gasFeeParamsBySpeed,
      baseFeePerGas,
      baseFeeTrend,
    } = parseRainbowMeteorologyData(data);
    return { baseFeePerGas, gasFeeParamsBySpeed, trend: baseFeeTrend };
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
            source = GAS_PRICE_SOURCES.POLYGON_GAS_STATION;
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
            const {
              gasFeeParamsBySpeed,
              baseFeePerGas,
              trend,
            } = await getEIP1559GasParams();
            console.log('gasFeeParamsBySpeed', gasFeeParamsBySpeed);
            const newGasFeeParamsBySpeed = await getGasFeesEstimates(
              gasFeeParamsBySpeed
            );
            if (!isEmpty(existingGasFees[CUSTOM])) {
              // Preserve custom values while updating prices
              newGasFeeParamsBySpeed[CUSTOM] = {
                ...existingGasFees[CUSTOM],
                baseFeePerGas,
              };
            } else if (isEmpty(newGasFeeParamsBySpeed[CUSTOM])) {
              // set CUSTOM to NORMAL if not defined
              newGasFeeParamsBySpeed[CUSTOM] = newGasFeeParamsBySpeed[NORMAL];
            }
            dispatch({
              payload: {
                currentBlockParams: { baseFeePerGas, trend },
                gasFeeParamsBySpeed: newGasFeeParamsBySpeed,
              },
              type: GAS_FEES_SUCCESS,
            });
          } catch (e) {
            captureException(new Error('Etherscan gas estimates failed'));
            logger.sentry('Etherscan gas estimates error:', e);
            logger.sentry('falling back to eth gas station');
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
  assetsOverride?: any[]
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    gasFeeParamsBySpeed,
    gasFeesBySpeed,
    txNetwork,
    selectedGasFee: oldSelectedFee,
  } = getState().gas;
  if (oldSelectedFee.option === newGasPriceOption) return;

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

export const gasUpdateDefaultGasLimit = (
  defaultGasLimit = ethUnits.basic_tx
) => (dispatch: AppDispatch) => {
  dispatch({
    payload: defaultGasLimit,
    type: GAS_UPDATE_DEFAULT_GAS_LIMIT,
  });
  dispatch(gasUpdateTxFee(defaultGasLimit));
};

export const gasUpdateTxFee = (
  gasLimit: number,
  overrideGasOption?: string
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    defaultGasLimit,
    gasFeeParamsBySpeed,
    selectedGasFee,
    txNetwork,
    currentBlockParams,
  } = getState().gas;
  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;

  const _gasLimit = gasLimit || defaultGasLimit;
  const _selectedGasFeeOption =
    overrideGasOption || selectedGasFee.option || NORMAL;
  const nativeTokenPriceUnit =
    txNetwork !== networkTypes.polygon
      ? ethereumUtils.getEthPriceUnit()
      : ethereumUtils.getMaticPriceUnit();

  if (isEmpty(gasFeeParamsBySpeed)) return;

  const isLegacyNetwork = isEIP1559LegacyNetwork(txNetwork);

  const gasFeesBySpeed = isLegacyNetwork
    ? parseLegacyGasFeesBySpeed(
        gasFeeParamsBySpeed,
        _gasLimit,
        nativeTokenPriceUnit,
        nativeCurrency
      )
    : parseGasFeesBySpeed(
        gasFeeParamsBySpeed,
        currentBlockParams?.baseFeePerGas,
        _gasLimit,
        nativeTokenPriceUnit,
        nativeCurrency
      );
  const selectedGasParams = getSelectedGasFee(
    assets,
    gasFeeParamsBySpeed,
    gasFeesBySpeed,
    _selectedGasFeeOption,
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

export const gasPricesStopPolling = () => (dispatch: AppDispatch) => {
  gasPricesHandle && clearTimeout(gasPricesHandle);
  dispatch({
    type: GAS_PRICES_RESET,
  });
};

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE: GasState = {
  currentBlockParams: {} as CurrentBlockParams,
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
    case GAS_PRICES_SUCCESS:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_FEES_SUCCESS:
      return {
        ...state,
        currentBlockParams: action.payload.currentBlockParams,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_PRICES_FAILURE:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_PRICES_CUSTOM_UPDATE_FAILURE:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
        gasFeesBySpeed: action.payload.gasFeesBySpeed,
        selectedGasFee: action.payload.selectedGasFee,
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
