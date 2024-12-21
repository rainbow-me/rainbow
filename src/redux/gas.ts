import { Mutex } from 'async-mutex';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import { AppDispatch, AppGetState } from './store';
import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';
import {
  BlocksToConfirmation,
  CurrentBlockParams,
  GasFee,
  GasFeeParam,
  GasFeeParams,
  GasFeeParamsBySpeed,
  GasFeesBySpeed,
  LegacyGasFee,
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  LegacySelectedGasFee,
  NativeCurrencyKey,
  SelectedGasFee,
} from '@/entities';

import { rainbowMeteorologyGetData } from '@/handlers/gasFees';
import { getProvider } from '@/handlers/web3';
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
} from '@/parsers';
import { ethUnits } from '@/references';
import { ethereumUtils, gasUtils } from '@/utils';
import { ChainId } from '@/state/backendNetworks/types';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { MeteorologyLegacyResponse, MeteorologyResponse } from '@/entities/gas';
import { addBuffer } from '@/helpers/utilities';
import { IS_TEST } from '@/env';

const { CUSTOM, NORMAL, URGENT } = gasUtils;

const mutex = new Mutex();

const withRunExclusive = async (callback: (...args: any[]) => void) => await mutex.runExclusive(callback);

const getDefaultGasLimit = (chainId: ChainId, defaultGasLimit: number): number => {
  switch (chainId) {
    case ChainId.arbitrum:
      return ethUnits.arbitrum_basic_tx;
    case ChainId.polygon:
    case ChainId.bsc:
    case ChainId.optimism:
    case ChainId.mainnet:
    case ChainId.zora:
    default:
      return defaultGasLimit;
  }
};

let gasPricesHandle: NodeJS.Timeout | null = null;

export interface GasState {
  defaultGasLimit: number;
  gasLimit: number | null;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed;
  chainId: ChainId;
  currentBlockParams: CurrentBlockParams;
  blocksToConfirmation: BlocksToConfirmation;
  customGasFeeModifiedByUser: boolean;
  l1GasFeeOptimism: BigNumber | null;
  secondsPerNewBlock: number;
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

const getSelectedGasFee = (
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed,
  gasFeesBySpeed: GasFeesBySpeed | LegacyGasFeesBySpeed,
  selectedGasFeeOption: string
): {
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
} => {
  const selectedGasParams = gasFeeParamsBySpeed[selectedGasFeeOption];
  const selectedTxFee = gasFeesBySpeed[selectedGasFeeOption];
  // this is going to be undefined for type 0 transactions
  const maxFee = (selectedTxFee as GasFee)?.maxFee;
  return {
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
  nativeCurrency: NativeCurrencyKey,
  selectedGasFeeOption: string,
  chainId: ChainId,
  l1GasFeeOptimism: BigNumber | null,
  isLegacyGasNetwork: boolean
) => {
  let nativeTokenPriceUnit = ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId: ChainId.mainnet });

  const chainsNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset();

  // we want to fetch the specific chain native token if anything but ETH
  const networkNativeAsset = chainsNativeAsset[chainId];
  if (networkNativeAsset.symbol.toLowerCase() !== 'eth') {
    nativeTokenPriceUnit = ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId });
  }

  const gasFeesBySpeed = isLegacyGasNetwork
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
        nativeCurrency,
        l1GasFeeOptimism
      );
  const selectedGasParams = getSelectedGasFee(gasFeeParamsBySpeed, gasFeesBySpeed, selectedGasFeeOption);
  return {
    gasFeesBySpeed,
    selectedGasFee: selectedGasParams?.selectedGasFee,
  };
};

// -- Actions --------------------------------------------------------------- //

/**
 * Used to update the selectedFee when trying to speed up or cancel
 * @param speed
 * @param newMaxPriorityFeePerGas
 */
export const updateGasFeeForSpeed =
  (speed: string, newMaxPriorityFeePerGas: string) => async (dispatch: AppDispatch, getState: AppGetState) => {
    const { gasFeeParamsBySpeed } = getState().gas;
    const newGasFeeParams = { ...gasFeeParamsBySpeed };
    newGasFeeParams[speed].maxPriorityFeePerGas = parseGasFeeParam(newMaxPriorityFeePerGas);

    dispatch({
      payload: {
        gasFeeParamsBySpeed: newGasFeeParams,
      },
      type: GAS_PRICES_SUCCESS,
    });
  };

export const gasUpdateToCustomGasFee = (gasParams: GasFeeParams) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    chainId,
    defaultGasLimit,
    gasFeesBySpeed,
    gasFeeParamsBySpeed,
    gasLimit,
    currentBlockParams,
    blocksToConfirmation,
    secondsPerNewBlock,
    l1GasFeeOptimism,
  } = getState().gas;

  const { nativeCurrency } = getState().settings;
  const _gasLimit = gasLimit || getDefaultGasLimit(chainId, defaultGasLimit);

  let nativeTokenPriceUnit = ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId: ChainId.mainnet });
  const chainsNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset();

  // we want to fetch the specific chain native token if anything but ETH
  const networkNativeAsset = chainsNativeAsset[chainId];
  if (networkNativeAsset.symbol.toLowerCase() !== 'eth') {
    nativeTokenPriceUnit = ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId });
  }

  const customGasFees = parseGasFees(
    gasParams,
    currentBlockParams?.baseFeePerGas,
    _gasLimit,
    nativeTokenPriceUnit,
    nativeCurrency,
    l1GasFeeOptimism
  );
  const newGasFeesBySpeed = { ...gasFeesBySpeed };
  const newGasFeeParamsBySpeed = { ...gasFeeParamsBySpeed };

  newGasFeesBySpeed[CUSTOM] = customGasFees;
  newGasFeeParamsBySpeed[CUSTOM] = defaultGasParamsFormat(
    CUSTOM,
    gasParams.maxBaseFee.amount,
    gasParams.maxPriorityFeePerGas.amount,
    blocksToConfirmation,
    secondsPerNewBlock
  );
  const newSelectedGasFee = getSelectedGasFee(newGasFeeParamsBySpeed, newGasFeesBySpeed, CUSTOM);
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

export const getProviderGasPrices = async ({ chainId }: { chainId: ChainId }) => {
  const provider = getProvider({ chainId });
  const baseGasPrice = await provider.getGasPrice();
  const normalGasPrice = weiToGwei(addBuffer(baseGasPrice.toString(), 1.05));

  const priceData = {
    fast: normalGasPrice,
    fastWait: 0.34,
    normal: normalGasPrice,
    // 20 secs
    normalWait: 0.34,
    urgent: normalGasPrice,
    urgentWait: 0.34,
  };
  return priceData;
};

interface MeterologyGasParams {
  baseFeePerGas: GasFeeParam;
  blocksToConfirmation: BlocksToConfirmation;
  currentBaseFee: GasFeeParam;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed;
  trend: number;
  secondsPerNewBlock: number;
  feeType: string;
}

interface LegacyMeterologyGasParams {
  feeType: string;
  fastGasPrice: string;
  proposeGasPrice: string;
  safeGasPrice: string;
}

export const getMeteorologyGasParams = async (chainId: ChainId): Promise<MeterologyGasParams | LegacyMeterologyGasParams> => {
  const { data } = (await rainbowMeteorologyGetData(chainId)) as {
    data: MeteorologyResponse | MeteorologyLegacyResponse;
  };
  if (data.meta.feeType === 'eip1559') {
    const { gasFeeParamsBySpeed, baseFeePerGas, baseFeeTrend, currentBaseFee, blocksToConfirmation, secondsPerNewBlock } =
      parseRainbowMeteorologyData(data as MeteorologyResponse);
    return {
      baseFeePerGas,
      blocksToConfirmation,
      currentBaseFee,
      gasFeeParamsBySpeed,
      trend: baseFeeTrend,
      secondsPerNewBlock,
      feeType: data.meta.feeType,
    };
  } else {
    const { fastGasPrice, safeGasPrice, proposeGasPrice } = (data as MeteorologyLegacyResponse).data.legacy;
    return {
      proposeGasPrice,
      safeGasPrice,
      fastGasPrice,
      feeType: data.meta.feeType,
    };
  }
};

export const gasPricesStartPolling =
  (chainId = ChainId.mainnet) =>
  async (dispatch: AppDispatch, getState: AppGetState) => {
    dispatch(gasPricesStopPolling());

    // this should be chain agnostic
    const getGasPrices = () =>
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
                selectedGasFee: lastSelectedGasFee,
                gasFeesBySpeed: lastGasFeesBySpeed,
                currentBlockParams,
                l1GasFeeOptimism,
              } = getState().gas;
              dispatch({
                payload: chainId,
                type: GAS_UPDATE_TRANSACTION_NETWORK,
              });

              const { nativeCurrency } = getState().settings;

              let dataIsReady = true;
              const meteorologySupportsChainId = useBackendNetworksStore.getState().getMeteorologySupportedChainIds().includes(chainId);
              if (!meteorologySupportsChainId) {
                const adjustedGasFees = await getProviderGasPrices({ chainId });
                if (!adjustedGasFees) return;

                const gasFeeParamsBySpeed = parseL2GasPrices(adjustedGasFees);
                if (!gasFeeParamsBySpeed) return;

                const _selectedGasFeeOption = selectedGasFee.option || NORMAL;
                const _gasLimit = gasLimit || getDefaultGasLimit(chainId, defaultGasLimit);
                const { selectedGasFee: updatedSelectedGasFee, gasFeesBySpeed: updatedGasFeesBySpeed } = dataIsReady
                  ? getUpdatedGasFeeParams(
                      currentBlockParams?.baseFeePerGas,
                      gasFeeParamsBySpeed,
                      _gasLimit,
                      nativeCurrency,
                      _selectedGasFeeOption,
                      chainId,
                      l1GasFeeOptimism,
                      true
                    )
                  : {
                      gasFeesBySpeed: lastGasFeesBySpeed,
                      selectedGasFee: lastSelectedGasFee,
                    };
                dispatch({
                  payload: {
                    gasFeeParamsBySpeed,
                    gasFeesBySpeed: updatedGasFeesBySpeed,
                    selectedGasFee: updatedSelectedGasFee,
                  },
                  type: GAS_FEES_SUCCESS,
                });
              } else {
                try {
                  // OP chains have an additional fee we need to load
                  if (useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains().includes(chainId)) {
                    dataIsReady = l1GasFeeOptimism !== null;
                  }
                  const meteorologyGasParams = await getMeteorologyGasParams(chainId);
                  if (meteorologyGasParams.feeType === 'eip1559') {
                    const { gasFeeParamsBySpeed, baseFeePerGas, trend, currentBaseFee, blocksToConfirmation, secondsPerNewBlock } =
                      meteorologyGasParams as MeterologyGasParams;

                    // Set a really gas estimate to guarantee that we're gonna be over
                    // the basefee at the time we fork mainnet during our anvil tests
                    let baseFee = baseFeePerGas;
                    if (chainId === ChainId.mainnet && IS_TEST && useConnectedToAnvilStore.getState().connectedToAnvil) {
                      baseFee = parseGasFeeParam(gweiToWei(1000));
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
                    const _gasLimit = gasLimit || getDefaultGasLimit(chainId, defaultGasLimit);

                    const { selectedGasFee: updatedSelectedGasFee, gasFeesBySpeed } = getUpdatedGasFeeParams(
                      currentBaseFee,
                      gasFeeParamsBySpeed,
                      _gasLimit,
                      nativeCurrency,
                      _selectedGasFeeOption,
                      chainId,
                      l1GasFeeOptimism,
                      false
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
                        selectedGasFee: updatedSelectedGasFee,
                        secondsPerNewBlock,
                      },
                      type: GAS_FEES_SUCCESS,
                    });
                  } else {
                    const { proposeGasPrice, safeGasPrice, fastGasPrice } = meteorologyGasParams as LegacyMeterologyGasParams;
                    const gasFeeParamsBySpeed = parseL2GasPrices({
                      fast: proposeGasPrice,
                      fastWait: 0.34,
                      normal: safeGasPrice,
                      normalWait: 0.34,
                      urgent: fastGasPrice,
                      urgentWait: 0.34,
                    });
                    if (!gasFeeParamsBySpeed) return;

                    const _selectedGasFeeOption = selectedGasFee.option || NORMAL;
                    const _gasLimit = gasLimit || getDefaultGasLimit(chainId, defaultGasLimit);
                    const { selectedGasFee: updatedSelectedGasFee, gasFeesBySpeed: updatedGasFeesBySpeed } = dataIsReady
                      ? getUpdatedGasFeeParams(
                          currentBlockParams?.baseFeePerGas,
                          gasFeeParamsBySpeed,
                          _gasLimit,
                          nativeCurrency,
                          _selectedGasFeeOption,
                          chainId,
                          l1GasFeeOptimism,
                          true
                        )
                      : {
                          gasFeesBySpeed: lastGasFeesBySpeed,
                          selectedGasFee: lastSelectedGasFee,
                        };
                    dispatch({
                      payload: {
                        gasFeeParamsBySpeed,
                        gasFeesBySpeed: updatedGasFeesBySpeed,
                        selectedGasFee: updatedSelectedGasFee,
                      },
                      type: GAS_FEES_SUCCESS,
                    });
                  }
                } catch (e) {
                  logger.error(new RainbowError(`[redux/gas]: Etherscan gas estimates error: ${e}`));
                }
              }

              fetchResolve(true);
            } catch (e) {
              logger.error(new RainbowError(`[redux/gas]: Gas Estimates Failed for ${chainId}: ${e}`));
              fetchReject(e);
            }
          })
      );

    const watchGasPrices = async (chainId: ChainId, pollingInterval: number) => {
      try {
        await getGasPrices();
        // eslint-disable-next-line no-empty
      } catch (e) {
      } finally {
        gasPricesHandle && clearTimeout(gasPricesHandle);
        gasPricesHandle = setTimeout(() => {
          watchGasPrices(chainId, pollingInterval);
        }, pollingInterval);
      }
    };

    const pollingInterval = useBackendNetworksStore.getState().getChainsPollingInterval()[chainId];
    watchGasPrices(chainId, pollingInterval);
  };

export const gasUpdateGasFeeOption = (newGasPriceOption: string) => (dispatch: AppDispatch, getState: AppGetState) =>
  withRunExclusive(async () => {
    const { gasFeeParamsBySpeed, gasFeesBySpeed, selectedGasFee: oldSelectedFee } = getState().gas;
    if (oldSelectedFee.option === newGasPriceOption) return;

    const gasPriceOption = newGasPriceOption || NORMAL;
    if (isEmpty(gasFeeParamsBySpeed)) return;
    const selectedGasFee = getSelectedGasFee(gasFeeParamsBySpeed, gasFeesBySpeed, gasPriceOption);
    dispatch({
      payload: selectedGasFee,
      type: GAS_UPDATE_GAS_PRICE_OPTION,
    });
    analytics.track('Updated Gas Price', { gasPriceOption: gasPriceOption });
  });

export const gasUpdateDefaultGasLimit =
  (defaultGasLimit = ethUnits.basic_tx) =>
  (dispatch: AppDispatch) => {
    dispatch({
      payload: defaultGasLimit,
      type: GAS_UPDATE_DEFAULT_GAS_LIMIT,
    });
    dispatch(gasUpdateTxFee(defaultGasLimit));
  };

export const gasUpdateTxFee =
  (updatedGasLimit?: number, overrideGasOption?: string, l1GasFeeOptimism: BigNumber | null = null) =>
  (dispatch: AppDispatch, getState: AppGetState) =>
    withRunExclusive(async () => {
      const { defaultGasLimit, gasLimit, gasFeeParamsBySpeed, selectedGasFee, chainId, currentBlockParams } = getState().gas;

      const { nativeCurrency } = getState().settings;
      if (
        isEmpty(gasFeeParamsBySpeed) ||
        (useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains().includes(chainId) && l1GasFeeOptimism === null)
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
        const _selectedGasFeeOption = overrideGasOption || selectedGasFee.option || NORMAL;
        const _gasLimit = updatedGasLimit || gasLimit || getDefaultGasLimit(chainId, defaultGasLimit);

        const { selectedGasFee: updatedSelectedGasFee, gasFeesBySpeed } = getUpdatedGasFeeParams(
          currentBlockParams?.baseFeePerGas,
          gasFeeParamsBySpeed,
          _gasLimit,
          nativeCurrency,
          _selectedGasFeeOption,
          chainId,
          l1GasFeeOptimism,
          (selectedGasFee as LegacyGasFee).estimatedFee !== undefined
        );
        dispatch({
          payload: {
            gasFeesBySpeed,
            gasLimit: _gasLimit,
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
  l1GasFeeOptimism: null,
  selectedGasFee: {} as SelectedGasFee,
  chainId: ChainId.mainnet,
  secondsPerNewBlock: 15,
};

export default (state = INITIAL_STATE, action: { type: string; payload: any }) => {
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
        selectedGasFee: action.payload.selectedGasFee,
        secondsPerNewBlock: action.payload.secondsPerNewBlock,
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
        l1GasFeeOptimism: action.payload.l1GasFeeOptimism,
        selectedGasFee: action.payload.selectedGasFee,
      };
    case GAS_UPDATE_GAS_PRICE_OPTION:
      return {
        ...state,
        selectedGasFee: action.payload.selectedGasFee,
      };
    case GAS_UPDATE_TRANSACTION_NETWORK:
      return {
        ...state,
        chainId: action.payload,
      };
    case GAS_PRICES_RESET:
      return INITIAL_STATE;
    default:
      return state;
  }
};
