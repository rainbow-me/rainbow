import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { Mutex } from 'async-mutex';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
import { AppDispatch, AppGetState } from './store';
import {
  BlocksToConfirmation,
  CurrentBlockParams,
  GasFee,
  GasFeeParam,
  GasFeeParams,
  GasFeeParamsBySpeed,
  GasFeesBySpeed,
  GasFeesPolygonGasStationData,
  LegacyGasFee,
  LegacyGasFeeParams,
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
  isHardHat,
  isL2Network,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  defaultGasParamsFormat,
  gweiToWei,
  parseGasFeeParam,
  parseGasFees,
  parseGasFeesBySpeed,
  parseL2GasPrices,
  parseLegacyGasFeesBySpeed,
  parseRainbowMeteorologyData,
  weiToGwei,
} from '@rainbow-me/parsers';
import { ethUnits } from '@rainbow-me/references';
import {
  fromWei,
  greaterThan,
  greaterThanOrEqualTo,
  multiply,
} from '@rainbow-me/utilities';
import { ethereumUtils, gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const { CUSTOM, NORMAL, URGENT } = gasUtils;

const mutex = new Mutex();

const withRunExclusive = async (callback: (...args: any[]) => void) =>
  await mutex.runExclusive(callback);

const getGasPricePollingInterval = (network: Network): number => {
  switch (network) {
    case Network.polygon:
      return 2000;
    case Network.arbitrum:
      return 3000;
    default:
      return 5000;
  }
};

const getDefaultGasLimit = (
  network: Network,
  defaultGasLimit: number
): number => {
  switch (network) {
    case Network.arbitrum:
      return ethUnits.arbitrum_basic_tx;
    case Network.polygon:
    case Network.optimism:
    case Network.mainnet:
    default:
      return defaultGasLimit;
  }
};

let gasPricesHandle: NodeJS.Timeout | null = null;

interface GasState {
  defaultGasLimit: number;
  gasLimit: number | null;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
  isSufficientGas: boolean | null;
  isValidGas: boolean;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed;
  txNetwork: Network | null;
  currentBlockParams: CurrentBlockParams;
  blocksToConfirmation: BlocksToConfirmation;
  customGasFeeModifiedByUser: boolean;
  l1GasFeeOptimism: BigNumber | null;
}

// -- Constants ------------------------------------------------------------- //
// const GAS_MULTIPLIER = 1.101;
const GAS_UPDATE_DEFAULT_GAS_LIMIT = 'gas/GAS_UPDATE_DEFAULT_GAS_LIMIT';
const GAS_UPDATE_GAS_LIMIT = 'gas/GAS_UPDATE_GAS_LIMIT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_FEES_SUCCESS = 'gas/GAS_FEES_SUCCESS';
const GAS_PRICES_CUSTOM_UPDATE = 'gas/GAS_PRICES_CUSTOM_UPDATE';

const GAS_PRICES_RESET = 'gas/GAS_PRICES_RESET';
const GAS_UPDATE_TX_FEE = 'gas/GAS_UPDATE_TX_FEE';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';
const GAS_UPDATE_TRANSACTION_NETWORK = 'gas/GAS_UPDATE_TRANSACTION_NETWORK';

const checkIsSufficientGas = (
  txFee: LegacyGasFee | GasFee,
  network: Network
) => {
  const isL2 = isL2Network(network);
  const txFeeValue = isL2
    ? (txFee as LegacyGasFee)?.estimatedFee
    : (txFee as GasFee)?.maxFee;
  const nativeAsset = ethereumUtils.getNetworkNativeAsset(network);
  const balanceAmount = nativeAsset?.balance?.amount || 0;
  const txFeeAmount = fromWei(txFeeValue?.value?.amount);
  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
  return isSufficientGas;
};

const checkValidGas = (
  selectedGasParams: LegacyGasFeeParams | GasFeeParams,
  network: Network
) => {
  const isL2 = isL2Network(network);
  const gasValue = isL2
    ? (selectedGasParams as LegacyGasFeeParams)?.gasPrice
    : (selectedGasParams as GasFeeParams)?.maxFeePerGas;
  const isValidGas = greaterThan(gasValue.amount, 0);
  return isValidGas;
};

const getSelectedGasFee = (
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed,
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed,
  selectedGasFeeOption: string,
  network: Network
): {
  isSufficientGas: boolean;
  isValidGas: boolean;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
} => {
  const selectedGasParams = gasFeeParamsBySpeed[selectedGasFeeOption];
  const selectedTxFee = gasFeesBySpeed[selectedGasFeeOption];
  const isSufficientGas = checkIsSufficientGas(selectedTxFee, network);
  const isValidGas = checkValidGas(selectedGasParams, network);
  // this is going to be undefined for type 0 transactions
  const maxFee = (selectedTxFee as GasFee)?.maxFee;
  return {
    isSufficientGas,
    isValidGas,
    selectedGasFee: {
      estimatedTime: selectedGasParams?.estimatedTime,
      gasFee: { ...selectedTxFee, maxFee },
      gasFeeParams: selectedGasParams,
      option: selectedGasFeeOption,
    } as SelectedGasFee | LegacySelectedGasFee,
  };
};

const getUpdatedGasFeeParams = (
  currentBaseFee: GasFeeParam,
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed,
  gasLimit: string,
  nativeCurrency: string,
  selectedGasFeeOption: string,
  txNetwork: Network,
  l1GasFeeOptimism: BigNumber | null = null
) => {
  const nativeTokenPriceUnit =
    txNetwork !== Network.polygon
      ? ethereumUtils.getEthPriceUnit()
      : ethereumUtils.getMaticPriceUnit();

  const isL2 = isL2Network(txNetwork);

  const gasFeesBySpeed = isL2
    ? parseLegacyGasFeesBySpeed(
        gasFeeParamsBySpeed as LegacyGasFeeParamsBySpeed,
        gasLimit,
        nativeTokenPriceUnit,
        nativeCurrency,
        l1GasFeeOptimism
      )
    : parseGasFeesBySpeed(
        gasFeeParamsBySpeed as GasFeeParamsBySpeed,
        currentBaseFee,
        gasLimit,
        nativeTokenPriceUnit,
        nativeCurrency
      );

  const selectedGasParams = getSelectedGasFee(
    gasFeeParamsBySpeed,
    gasFeesBySpeed,
    selectedGasFeeOption,
    txNetwork
  );
  return {
    gasFeesBySpeed,
    isSufficientGas: selectedGasParams?.isSufficientGas,
    isValidGas: selectedGasParams?.isValidGas,
    selectedGasFee: selectedGasParams?.selectedGasFee,
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
    blocksToConfirmation,
  } = getState().gas;

  const { nativeCurrency } = getState().settings;
  const _gasLimit = gasLimit || getDefaultGasLimit(txNetwork, defaultGasLimit);

  const nativeTokenPriceUnit =
    txNetwork !== Network.polygon
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
    gasParams.maxFeePerGas.amount,
    gasParams.maxPriorityFeePerGas.amount,
    blocksToConfirmation
  );
  const newSelectedGasFee = getSelectedGasFee(
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

export const gasPricesStartPolling = (network = Network.mainnet) => async (
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
    const provider = await getProviderForNetwork(Network.arbitrum);
    const baseGasPrice = await provider.getGasPrice();
    const baseGasPriceGwei = weiToGwei(baseGasPrice.toString());
    const fastGasPriceAdjusted = multiply(baseGasPriceGwei, '1.2');
    const normalGasPriceAdjusted = multiply(baseGasPriceGwei, '1');
    const safeLowGasPriceWithBuffer = multiply(baseGasPriceGwei, '0.8');
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
    const provider = await getProviderForNetwork(Network.optimism);
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
      blocksToConfirmation,
    } = parseRainbowMeteorologyData(data);
    return {
      baseFeePerGas,
      blocksToConfirmation,
      currentBaseFee,
      gasFeeParamsBySpeed,
      trend: baseFeeTrend,
    };
  };

  const getGasPrices = (network: Network) =>
    withRunExclusive(
      () =>
        new Promise(async (fetchResolve, fetchReject) => {
          try {
            const {
              gasFeeParamsBySpeed: existingGasFees,
              customGasFeeModifiedByUser,
              defaultGasLimit,
              gasLimit,
              selectedGasFee,
              txNetwork,
              isSufficientGas: lastIsSufficientGas,
              selectedGasFee: lastSelectedGasFee,
              gasFeesBySpeed: lastGasFeesBySpeed,
              isValidGas: lastIsValidGas,
              currentBlockParams,
              l1GasFeeOptimism,
            } = getState().gas;
            const { nativeCurrency } = getState().settings;
            const isL2 = isL2Network(network);
            let dataIsReady = true;
            if (isL2) {
              let adjustedGasFees;
              if (network === Network.polygon) {
                adjustedGasFees = await getPolygonGasPrices();
              } else if (network === Network.arbitrum) {
                adjustedGasFees = await getArbitrumGasPrices();
              } else if (network === Network.optimism) {
                adjustedGasFees = await getOptimismGasPrices();
                dataIsReady = l1GasFeeOptimism !== null;
              }

              const gasFeeParamsBySpeed = parseL2GasPrices(
                adjustedGasFees,
                network
              );

              if (!gasFeeParamsBySpeed) return;

              const _selectedGasFeeOption = selectedGasFee.option || NORMAL;
              const _gasLimit =
                gasLimit || getDefaultGasLimit(txNetwork, defaultGasLimit);
              const {
                isSufficientGas: updatedIsSufficientGas,
                isValidGas: updatedIsValidGas,
                selectedGasFee: updatedSelectedGasFee,
                gasFeesBySpeed: updatedGasFeesBySpeed,
              } = dataIsReady
                ? getUpdatedGasFeeParams(
                    currentBlockParams?.baseFeePerGas,
                    gasFeeParamsBySpeed,
                    _gasLimit,
                    nativeCurrency,
                    _selectedGasFeeOption,
                    txNetwork,
                    l1GasFeeOptimism
                  )
                : {
                    gasFeesBySpeed: lastGasFeesBySpeed,
                    isSufficientGas: lastIsSufficientGas,
                    isValidGas: lastIsValidGas,
                    selectedGasFee: lastSelectedGasFee,
                  };
              dispatch({
                payload: {
                  gasFeeParamsBySpeed,
                  gasFeesBySpeed: updatedGasFeesBySpeed,
                  isSufficientGas: updatedIsSufficientGas,
                  isValidGas: updatedIsValidGas,
                  selectedGasFee: updatedSelectedGasFee,
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
                  blocksToConfirmation,
                } = await getEIP1559GasParams();

                // Set a really gas estimate to guarantee that we're gonna be over
                // the basefee at the time we fork mainnet during our hardhat tests
                let baseFee = baseFeePerGas;
                if (network === Network.mainnet && IS_TESTING === 'true') {
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
                const _selectedGasFeeOption = selectedGasFee.option || NORMAL;
                const _gasLimit =
                  gasLimit || getDefaultGasLimit(txNetwork, defaultGasLimit);

                const {
                  isSufficientGas,
                  isValidGas,
                  selectedGasFee: updatedSelectedGasFee,
                  gasFeesBySpeed,
                } = getUpdatedGasFeeParams(
                  currentBaseFee,
                  gasFeeParamsBySpeed,
                  _gasLimit,
                  nativeCurrency,
                  _selectedGasFeeOption,
                  txNetwork,
                  null
                );

                dispatch({
                  payload: {
                    blocksToConfirmation,
                    currentBlockParams: {
                      baseFeePerGas: currentBaseFee,
                      trend,
                    },
                    gasFeeParamsBySpeed: gasFeeParamsBySpeed,
                    gasFeesBySpeed,
                    isSufficientGas,
                    isValidGas,
                    selectedGasFee: updatedSelectedGasFee,
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
            captureException(new Error('all gas estimates failed'));
            logger.sentry('gas estimates error', error);
            fetchReject(error);
          }
        })
    );

  const watchGasPrices = async (network: Network, pollingInterval: number) => {
    try {
      await getGasPrices(network);
      // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      gasPricesHandle && clearTimeout(gasPricesHandle);
      gasPricesHandle = setTimeout(() => {
        watchGasPrices(network, pollingInterval);
      }, pollingInterval);
    }
  };

  const pollingInterval = getGasPricePollingInterval(network);
  watchGasPrices(network, pollingInterval);
};

export const gasUpdateGasFeeOption = (newGasPriceOption: string) => (
  dispatch: AppDispatch,
  getState: AppGetState
) =>
  withRunExclusive(async () => {
    const {
      gasFeeParamsBySpeed,
      gasFeesBySpeed,
      txNetwork,
      selectedGasFee: oldSelectedFee,
    } = getState().gas;
    if (oldSelectedFee.option === newGasPriceOption) return;

    const gasPriceOption = newGasPriceOption || NORMAL;
    if (isEmpty(gasFeeParamsBySpeed)) return;
    const selectedGasFee = getSelectedGasFee(
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
  });

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
  updatedGasLimit?: number,
  overrideGasOption?: string,
  l1GasFeeOptimism: BigNumber | null = null
) => (dispatch: AppDispatch, getState: AppGetState) =>
  withRunExclusive(async () => {
    const {
      defaultGasLimit,
      gasLimit,
      gasFeeParamsBySpeed,
      selectedGasFee,
      txNetwork,
      currentBlockParams,
    } = getState().gas;
    const { nativeCurrency } = getState().settings;
    if (
      isEmpty(gasFeeParamsBySpeed) ||
      (txNetwork === Network.optimism && l1GasFeeOptimism === null)
    ) {
      // if fee prices not ready, we need to store the gas limit for future calculations
      // the rest is as the initial state value
      if (updatedGasLimit) {
        dispatch({
          payload: updatedGasLimit,
          type: GAS_UPDATE_GAS_LIMIT,
        });
      }
    } else {
      const _selectedGasFeeOption =
        overrideGasOption || selectedGasFee.option || NORMAL;
      const _gasLimit =
        updatedGasLimit ||
        gasLimit ||
        getDefaultGasLimit(txNetwork, defaultGasLimit);

      const {
        isSufficientGas,
        isValidGas,
        selectedGasFee: updatedSelectedGasFee,
        gasFeesBySpeed,
      } = getUpdatedGasFeeParams(
        currentBlockParams?.baseFeePerGas,
        gasFeeParamsBySpeed,
        _gasLimit,
        nativeCurrency,
        _selectedGasFeeOption,
        txNetwork,
        l1GasFeeOptimism
      );

      dispatch({
        payload: {
          gasFeesBySpeed,
          gasLimit: _gasLimit,
          isSufficientGas,
          isValidGas,
          l1GasFeeOptimism,
          selectedGasFee: updatedSelectedGasFee,
        },
        type: GAS_UPDATE_TX_FEE,
      });
    }
  });

export const gasPricesStopPolling = () => (dispatch: AppDispatch) => {
  gasPricesHandle && clearTimeout(gasPricesHandle);
  dispatch({
    type: GAS_PRICES_RESET,
  });
};

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE: GasState = {
  blocksToConfirmation: {} as BlocksToConfirmation,
  currentBlockParams: {} as CurrentBlockParams,
  customGasFeeModifiedByUser: false,
  defaultGasLimit: ethUnits.basic_tx,
  gasFeeParamsBySpeed: {},
  gasFeesBySpeed: {},
  gasLimit: null,
  isSufficientGas: null,
  isValidGas: true,
  l1GasFeeOptimism: null,
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
    case GAS_UPDATE_GAS_LIMIT:
      return {
        ...state,
        gasLimit: action.payload,
      };
    case GAS_PRICES_SUCCESS:
      return {
        ...state,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
      };
    case GAS_FEES_SUCCESS:
      return {
        ...state,
        blocksToConfirmation: action.payload.blocksToConfirmation,
        currentBlockParams: action.payload.currentBlockParams,
        gasFeeParamsBySpeed: action.payload.gasFeeParamsBySpeed,
        gasFeesBySpeed: action.payload.gasFeesBySpeed,
        isSufficientGas: action.payload.isSufficientGas,
        isValidGas: action.payload.isValidGas,
        selectedGasFee: action.payload.selectedGasFee,
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
        isValidGas: action.payload.isValidGas,
        l1GasFeeOptimism: action.payload.l1GasFeeOptimism,
        selectedGasFee: action.payload.selectedGasFee,
      };
    case GAS_UPDATE_GAS_PRICE_OPTION:
      return {
        ...state,
        isSufficientGas: action.payload.isSufficientGas,
        isValidGas: action.payload.isValidGas,
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
