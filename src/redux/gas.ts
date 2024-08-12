import { Mutex } from 'async-mutex';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import { IS_TESTING } from 'react-native-dotenv';
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
  LegacyGasFeeParamsBySpeed,
  LegacyGasFeesBySpeed,
  LegacySelectedGasFee,
  NativeCurrencyKey,
  RainbowMeteorologyData,
  RainbowMeteorologyLegacyData,
  SelectedGasFee,
} from '@/entities';

import { rainbowMeteorologyGetData } from '@/handlers/gasFees';
import { getProviderForNetwork, isHardHat, toHex, web3Provider } from '@/handlers/web3';
import { Network } from '@/helpers/networkTypes';
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
import { multiply } from '@/helpers/utilities';
import { ethereumUtils, gasUtils } from '@/utils';
import { getNetworkObject } from '@/networks';
import { ChainId } from '@/__swaps__/types/chains';

const { CUSTOM, FAST, NORMAL, SLOW, URGENT, FLASHBOTS_MIN_TIP } = gasUtils;

const mutex = new Mutex();

const withRunExclusive = async (callback: (...args: any[]) => void) => await mutex.runExclusive(callback);

const getGasPricePollingInterval = (chainId: ChainId): number => {
  return getNetworkObject({ chainId }).gas.pollingIntervalInMs;
};

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
  l1GasFeeOptimism: BigNumber | null = null
) => {
  let nativeTokenPriceUnit = ethereumUtils.getEthPriceUnit();

  switch (chainId) {
    case ChainId.polygon:
      nativeTokenPriceUnit = ethereumUtils.getMaticPriceUnit();
      break;
    case ChainId.bsc:
      nativeTokenPriceUnit = ethereumUtils.getBnbPriceUnit();
      break;
    case ChainId.avalanche:
      nativeTokenPriceUnit = ethereumUtils.getAvaxPriceUnit();
      break;
    case ChainId.degen:
      nativeTokenPriceUnit = ethereumUtils.getDegenPriceUnit();
      break;
    default:
      nativeTokenPriceUnit = ethereumUtils.getEthPriceUnit();
      break;
  }

  const isLegacyGasNetwork = getNetworkObject({ chainId }).gas.gasType === 'legacy';

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

  let nativeTokenPriceUnit = ethereumUtils.getEthPriceUnit();

  switch (chainId) {
    case ChainId.polygon:
      nativeTokenPriceUnit = ethereumUtils.getMaticPriceUnit();
      break;
    case ChainId.bsc:
      nativeTokenPriceUnit = ethereumUtils.getBnbPriceUnit();
      break;
    default:
      nativeTokenPriceUnit = ethereumUtils.getEthPriceUnit();
      break;
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

export const getPolygonGasPrices = async () => {
  try {
    const {
      data: {
        data: { legacy: result },
      },
    } = (await rainbowMeteorologyGetData(ChainId.polygon)) as {
      data: RainbowMeteorologyLegacyData;
    };
    const polygonGasPriceBumpFactor = 1.05;

    // Override required to make it compatible with other responses
    const polygonGasStationPrices = {
      fast: Math.ceil(Number(multiply(result['proposeGasPrice'], polygonGasPriceBumpFactor))),
      // 1 blocks, 2.5 - 3 secs
      fastWait: 0.05,
      normal: Math.ceil(Number(multiply(result['safeGasPrice'], polygonGasPriceBumpFactor))),
      // 2 blocks, 6 secs
      normalWait: 0.1,
      urgent: Math.ceil(Number(multiply(result['fastGasPrice'], polygonGasPriceBumpFactor))),
      // 1 blocks, 2.5 - 3 secs
      urgentWait: 0.05,
    };
    return polygonGasStationPrices;
  } catch (e) {
    logger.error(new RainbowError(`[redux/gas]: failed to fetch polygon gas prices ${e}`));
    return null;
  }
};

export const getBscGasPrices = async () => {
  try {
    const {
      data: {
        data: { legacy: result },
      },
    } = (await rainbowMeteorologyGetData(ChainId.bsc)) as {
      data: RainbowMeteorologyLegacyData;
    };

    const bscGasPriceBumpFactor = 1.05;

    // Override required to make it compatible with other responses
    const bscGasStationPrices = {
      fast: Math.ceil(Number(multiply(result['proposeGasPrice'], bscGasPriceBumpFactor))),
      // 1 blocks, 2.5 - 3 secs
      fastWait: 0.05,
      normal: Math.ceil(Number(multiply(result['safeGasPrice'], bscGasPriceBumpFactor))),
      // 2 blocks, 6 secs
      normalWait: 0.1,
      urgent: Math.ceil(Number(multiply(result['fastGasPrice'], bscGasPriceBumpFactor))),
      // 1 blocks, 2.5 - 3 secs
      urgentWait: 0.05,
    };
    return bscGasStationPrices;
  } catch (e) {
    logger.error(new RainbowError(`[redux/gas]: failed to fetch BSC gas prices ${e}`));
    return null;
  }
};
export const getArbitrumGasPrices = async () => {
  const provider = getProviderForNetwork(Network.arbitrum);
  const baseGasPrice = await provider.getGasPrice();
  const normalGasPrice = weiToGwei(baseGasPrice.toString());

  const priceData = {
    fast: Number(normalGasPrice),
    fastWait: 0.14,
    // 2 blocks, 8 secs
    normal: Number(normalGasPrice),
    normalWait: 0.14,
    urgent: Number(normalGasPrice),
    urgentWait: 0.14,
  };

  return priceData;
};

export const getOptimismGasPrices = async () => {
  const provider = getProviderForNetwork(Network.optimism);
  const baseGasPrice = await provider.getGasPrice();
  const normalGasPrice = weiToGwei(baseGasPrice.toString());

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

export const getBaseGasPrices = async () => {
  const provider = getProviderForNetwork(Network.base);
  const baseGasPrice = await provider.getGasPrice();

  const BasePriceBumpFactor = 1.05;
  const normalGasPrice = toHex(Math.ceil(Number((baseGasPrice.toString(), BasePriceBumpFactor))));

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

export const getAvalancheGasPrices = async () => {
  const provider = getProviderForNetwork(Network.avalanche);
  const baseGasPrice = await provider.getGasPrice();

  const AvalanchePriceBumpFactor = 1.05;
  const normalGasPrice = toHex(Math.ceil(Number((baseGasPrice.toString(), AvalanchePriceBumpFactor))));

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

export const getDegenGasPrices = async () => {
  const provider = getProviderForNetwork(Network.degen);
  const baseGasPrice = await provider.getGasPrice();

  const DegenPriceBumpFactor = 1.05;
  const normalGasPrice = toHex(Math.ceil(Number((baseGasPrice.toString(), DegenPriceBumpFactor))));

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

export const getBlastGasPrices = async () => {
  const provider = getProviderForNetwork(Network.blast);
  const baseGasPrice = await provider.getGasPrice();

  const BlastPriceBumpFactor = 1.05;
  const normalGasPrice = toHex(Math.ceil(Number((baseGasPrice.toString(), BlastPriceBumpFactor))));

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

export const getZoraGasPrices = async () => {
  const provider = getProviderForNetwork(Network.zora);
  const baseGasPrice = await provider.getGasPrice();

  const ZoraPriceBumpFactor = 1.05;
  const normalGasPrice = toHex(Math.ceil(Number((baseGasPrice.toString(), ZoraPriceBumpFactor))));

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

export const getEIP1559GasParams = async (chainId: ChainId) => {
  const { data } = (await rainbowMeteorologyGetData(chainId)) as {
    data: RainbowMeteorologyData;
  };
  const { gasFeeParamsBySpeed, baseFeePerGas, baseFeeTrend, currentBaseFee, blocksToConfirmation, secondsPerNewBlock } =
    parseRainbowMeteorologyData(data);
  return {
    baseFeePerGas,
    blocksToConfirmation,
    currentBaseFee,
    gasFeeParamsBySpeed,
    trend: baseFeeTrend,
    secondsPerNewBlock,
  };
};

export const gasPricesStartPolling =
  (chainId = ChainId.mainnet, flashbots = false) =>
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
                chainId,
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

              const networkObject = getNetworkObject({ chainId });
              let dataIsReady = true;

              if (networkObject.gas.gasType === 'legacy') {
                // OP chains have an additional fee we need to load
                if (networkObject.gas?.OptimismTxFee) {
                  dataIsReady = l1GasFeeOptimism !== null;
                }

                const adjustedGasFees = await networkObject.gas.getGasPrices();

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
                      l1GasFeeOptimism
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
                  const { gasFeeParamsBySpeed, baseFeePerGas, trend, currentBaseFee, blocksToConfirmation, secondsPerNewBlock } =
                    await getEIP1559GasParams(chainId);

                  if (flashbots) {
                    [SLOW, NORMAL, FAST, URGENT].forEach(speed => {
                      // Override min tip to 5 if needed, when flashbots is enabled
                      // See https://docs.flashbots.net/flashbots-protect/rpc/quick-start#choosing-the-right-gas-price
                      if (gasFeeParamsBySpeed[speed]) {
                        if (Number(gasFeeParamsBySpeed[speed].maxPriorityFeePerGas.gwei) < FLASHBOTS_MIN_TIP) {
                          gasFeeParamsBySpeed[speed] = {
                            ...gasFeeParamsBySpeed[speed],
                            maxPriorityFeePerGas: {
                              amount: `${FLASHBOTS_MIN_TIP}000000000`,
                              display: `${FLASHBOTS_MIN_TIP} gwei`,
                              gwei: `${FLASHBOTS_MIN_TIP}`,
                            },
                          };
                        }
                      }
                    });
                  }

                  // Set a really gas estimate to guarantee that we're gonna be over
                  // the basefee at the time we fork mainnet during our hardhat tests
                  let baseFee = baseFeePerGas;
                  if (chainId === ChainId.mainnet && IS_TESTING === 'true') {
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
                  const _gasLimit = gasLimit || getDefaultGasLimit(chainId, defaultGasLimit);

                  const { selectedGasFee: updatedSelectedGasFee, gasFeesBySpeed } = getUpdatedGasFeeParams(
                    currentBaseFee,
                    gasFeeParamsBySpeed,
                    _gasLimit,
                    nativeCurrency,
                    _selectedGasFeeOption,
                    chainId,
                    l1GasFeeOptimism
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

    const pollingInterval = getGasPricePollingInterval(chainId);
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
      if (isEmpty(gasFeeParamsBySpeed) || (getNetworkObject({ chainId }).gas?.OptimismTxFee && l1GasFeeOptimism === null)) {
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
          l1GasFeeOptimism
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
