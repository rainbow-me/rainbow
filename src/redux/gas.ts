import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { isEmpty } from 'lodash';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
import { AppDispatch, AppGetState } from './store';
import {
  ConfirmationTimeByPriorityFee,
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
  polygonGasStationGetGasPrices,
  polygonGetGasEstimates,
  rainbowMeteorologyGetData,
} from '@rainbow-me/handlers/gasFees';
import {
  getProviderForNetwork,
  isEIP1559LegacyNetwork,
  isHardHat,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import networkTypes, { Network } from '@rainbow-me/helpers/networkTypes';
import {
  defaultGasParamsFormat,
  getFallbackGasPrices,
  gweiToWei,
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

const { CUSTOM, NORMAL, URGENT, GAS_PRICE_SOURCES } = gasUtils;
const GAS_PRICE_INTERVAL = 5000; // 5 seconds

let gasPricesHandle: NodeJS.Timeout | null = null;

interface GasState {
  defaultGasLimit: number;
  gasLimit: number | null;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
  isSufficientGas: boolean | null;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed;
  txNetwork: Network | null;
  currentBlockParams: CurrentBlockParams;
  confirmationTimeByPriorityFee: ConfirmationTimeByPriorityFee;
  customGasFeeModifiedByUser: boolean;
}

// -- Constants ------------------------------------------------------------- //
// const GAS_MULTIPLIER = 1.101;
const GAS_UPDATE_DEFAULT_GAS_LIMIT = 'gas/GAS_UPDATE_DEFAULT_GAS_LIMIT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_FEES_SUCCESS = 'gas/GAS_FEES_SUCCESS';
const GAS_PRICES_FAILURE = 'gas/GAS_PRICES_FAILURE';
const GAS_PRICES_CUSTOM_UPDATE = 'gas/GAS_PRICES_CUSTOM_UPDATE';

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
  const txFeeValue =
    (txFee as GasFee)?.maxFee || (txFee as LegacyGasFee)?.estimatedFee;
  const nativeAsset = getNetworkNativeAsset(assets, network);
  const balanceAmount = nativeAsset?.balance?.amount || 0;
  const txFeeAmount = fromWei(txFeeValue?.value?.amount || 0);
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
  // this is going to be undefined for type 0 transactions
  const maxFee = (selectedTxFee as GasFee)?.maxFee;

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

/**
 * Used to update the selectedFee when trying to speed up or cancel
 * @param speed
 * @param newMaxPriorityFeePerGas
 */
export const updateGasFeeForSpeed = (
  speed: string,
  newMaxPriorityFeePerGas: string
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
    currentBlockParams,
    confirmationTimeByPriorityFee,
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
  newGasFeeParamsBySpeed[CUSTOM] = defaultGasParamsFormat(
    CUSTOM,
    currentBlockParams.baseFeePerGas.amount,
    gasParams.maxFeePerGas.amount,
    gasParams.maxPriorityFeePerGas.amount,
    confirmationTimeByPriorityFee
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
      customGasFeeModifiedByUser: true,
      gasFeeParamsBySpeed: newGasFeeParamsBySpeed,
      gasFeesBySpeed: newGasFeesBySpeed,
      selectedGasFee: newSelectedGasFee.selectedGasFee,
    },
    type: GAS_PRICES_CUSTOM_UPDATE,
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

  const getEIP1559GasParams = async () => {
    const { data } = (await rainbowMeteorologyGetData()) as {
      data: RainbowMeteorologyData;
    };
    const {
      gasFeeParamsBySpeed,
      baseFeePerGas,
      baseFeeTrend,
      currentBaseFee,
      confirmationTimeByPriorityFee,
    } = parseRainbowMeteorologyData(data);
    return {
      baseFeePerGas,
      confirmationTimeByPriorityFee,
      currentBaseFee,
      gasFeeParamsBySpeed,
      trend: baseFeeTrend,
    };
  };

  const getGasPrices = (network: Network) =>
    new Promise(async (fetchResolve, fetchReject) => {
      try {
        const {
          gasFeeParamsBySpeed: existingGasFees,
          customGasFeeModifiedByUser,
        } = getState().gas;
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
              currentBaseFee,
              confirmationTimeByPriorityFee,
            } = await getEIP1559GasParams();

            // Set a really gas estimate to guarantee that we're gonna be over
            // the basefee at the time we fork mainnet during our hardhat tests
            let baseFee = baseFeePerGas;
            if (network === networkTypes.mainnet && IS_TESTING === 'true') {
              const providerUrl = (
                web3Provider ||
                ({} as {
                  connection: { url: string };
                })
              )?.connection?.url;
              if (isHardHat(providerUrl)) {
                baseFee = parseGasFeeParam(gweiToWei(1000));
              }
            }

            if (customGasFeeModifiedByUser) {
              // Preserve custom values while updating prices
              gasFeeParamsBySpeed[CUSTOM] = {
                ...existingGasFees[CUSTOM],
                baseFeePerGas: baseFee,
              };
            } else {
              // set CUSTOM to URGENT if not defined
              gasFeeParamsBySpeed[CUSTOM] = gasFeeParamsBySpeed[URGENT];
            }
            dispatch({
              payload: {
                confirmationTimeByPriorityFee,
                currentBlockParams: { baseFeePerGas: currentBaseFee, trend },
                gasFeeParamsBySpeed: gasFeeParamsBySpeed,
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
      }, GAS_PRICE_INTERVAL);
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
  gasLimit?: number,
  overrideGasOption?: string,
  l1GasFeeOptimism = null
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
        nativeCurrency,
        l1GasFeeOptimism
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
  confirmationTimeByPriorityFee: {} as ConfirmationTimeByPriorityFee,
  currentBlockParams: {} as CurrentBlockParams,
  customGasFeeModifiedByUser: false,
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
        confirmationTimeByPriorityFee:
          action.payload.confirmationTimeByPriorityFee,
        currentBlockParams: action.payload.currentBlockParams,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_PRICES_FAILURE:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_PRICES_CUSTOM_UPDATE:
      return {
        ...state,
        customGasFeeModifiedByUser: action.payload.customGasFeeModifiedByUser,
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
