import { BigNumberish } from '@ethersproject/bignumber';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { get, isEmpty } from 'lodash';
import { AppDispatch, AppGetState } from './store';
import {
  EstimatedGasFees,
  EstimatedLegacyGasFees,
  LegacyTxFees,
  SelectedGasFee,
  TxFees,
} from '@rainbow-me/entities';
import {
  blockNativeGetGasParams,
  getEstimatedTimeForGasPrice,
  maticGasStationGetGasPrices,
  maticGetGasEstimates,
} from '@rainbow-me/handlers/gasFees';
import {
  getProviderForNetwork,
  isEIP1559SupportedNetwork,
  isL2Network,
} from '@rainbow-me/handlers/web3';
import networkTypes, { Network } from '@rainbow-me/helpers/networkTypes';
import {
  defaultGasPriceFormat,
  getFallbackGasPrices,
  parseEIP1559GasData,
  parseEip1559TxFees,
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

interface GasState {
  defaultGasLimit: number;
  gasLimit: number | null;
  legacyGasFees: EstimatedLegacyGasFees;
  gasFees: EstimatedGasFees;
  gasParams: EstimatedLegacyGasFees | EstimatedGasFees;
  isSufficientGas: Boolean | null;
  selectedGasFee: SelectedGasFee;
  txFees: Object;
}

// -- Constants ------------------------------------------------------------- //
const OPTIMISM_GAS_PRICE_GWEI = 0.015;
// const GAS_MULTIPLIER = 1.101;
const GAS_UPDATE_DEFAULT_GAS_LIMIT = 'gas/GAS_UPDATE_DEFAULT_GAS_LIMIT';
const GAS_PRICES_DEFAULT = 'gas/GAS_PRICES_DEFAULT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';
const GAS_PRICES_FAILURE = 'gas/GAS_PRICES_FAILURE';

const GAS_PRICES_RESET = 'gas/GAS_PRICES_RESET';
const GAS_UPDATE_TX_FEE = 'gas/GAS_UPDATE_TX_FEE';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';

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
//   const txFees = parseTxFees(
//     fallbackGasPrices,
//     ethPriceUnit,
//     defaultGasLimit,
//     nativeCurrency
//   );
//   const selectedGasFee = {
//     ...txFees[NORMAL],
//     ...fallbackGasPrices[NORMAL],
//   };
//   return {
//     fallbackGasPrices,
//     selectedGasFee,
//     txFees,
//   };
// };

export const updateGasPriceForSpeed = (
  speed: string,
  newPrice: number
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { legacyGasFees } = getState().gas;

  // TODO handle updates

  const newGasParams = { ...legacyGasFees };
  newGasParams[speed].value = {
    amount: newPrice,
    display: `${newPrice} Gwei`,
  };

  dispatch({
    payload: {
      legacyGasFees,
    },
    type: GAS_PRICES_SUCCESS,
  });
};

export const gasPricesStartPolling = (network = networkTypes.mainnet) => async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  dispatch(gasPricesStopPolling());

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
    return parseEIP1559GasData(data);
  };

  const getGasPrices = (network: Network) =>
    new Promise(async (fetchResolve, fetchReject) => {
      try {
        const {
          legacyGasFees: existingGasPrices,
          gasFees: existingEip1559GasPrices,
        } = getState().gas;

        let adjustedGasPrices;
        let gasFees = existingEip1559GasPrices;
        let source = GAS_PRICE_SOURCES.ETHERSCAN;
        if (network === networkTypes.polygon) {
          source = GAS_PRICE_SOURCES.MATIC_GAS_STATION;
          adjustedGasPrices = await getPolygonGasPrices();
        } else if (network === networkTypes.arbitrum) {
          source = GAS_PRICE_SOURCES.ARBITRUM_NODE;
          adjustedGasPrices = await getArbitrumGasPrices();
        } else if (network === networkTypes.optimism) {
          source = GAS_PRICE_SOURCES.OPTIMISM_NODE;
          adjustedGasPrices = await getOptimismGasPrices();
        } else {
          try {
            // // Use etherscan as our Gas Price Oracle
            // const {
            //   data: { result: etherscanGasPrices },
            // } = await etherscanGetGasPrices();
            gasFees = await getEIP1559GasParams();
            // const priceData = {
            //   average: Number(etherscanGasPrices.ProposeGasPrice),
            //   fast: Number(etherscanGasPrices.FastGasPrice),
            //   safeLow: Number(etherscanGasPrices.SafeGasPrice),
            // };

            // should add multiplier logic here

            // Add gas estimated times
            // adjustedGasPrices = await etherscanGetGasEstimates(priceData);
          } catch (e) {
            captureException(new Error('Etherscan gas estimates failed'));
            logger.sentry('Etherscan gas estimates error:', e);
            logger.sentry('falling back to eth gas station');
            source = GAS_PRICE_SOURCES.ETH_GAS_STATION;
            // Fallback to ETHGasStation if Etherscan fails
            // const {
            //   data: ethGasStationPrices,
            // } = await ethGasStationGetGasPrices();
            // // Only bumping for ETHGasStation
            // adjustedGasPrices = bumpGasPrices(ethGasStationPrices);
          }
        }

        const legacyGasFees = parseGasPrices(adjustedGasPrices, source);
        if (existingGasPrices[CUSTOM] !== null) {
          // Preserve custom values while updating prices
          legacyGasFees[CUSTOM] = existingGasPrices[CUSTOM];
        }

        dispatch({
          payload: {
            gasFees,
            legacyGasFees,
          },
          type: GAS_PRICES_SUCCESS,
        });

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
  const { legacyGasFees, gasFees, txFees } = getState().gas;
  const { assets } = getState().data;
  let selectedGasFee;

  if (isEIP1559SupportedNetwork(network)) {
    if (isEmpty(gasFees)) return;
    selectedGasFee = getSelectedGasFee(
      assetsOverride || assets,
      gasFees,
      txFees,
      newGasPriceOption
    );
  } else {
    if (isEmpty(legacyGasFees)) return;
    selectedGasFee = getLegacySelectedGasFee(
      assetsOverride || assets,
      legacyGasFees,
      txFees,
      newGasPriceOption,
      network
    );
  }

  dispatch({
    payload: selectedGasFee,
    type: GAS_UPDATE_GAS_PRICE_OPTION,
  });
  analytics.track('Updated Gas Price', { gasPriceOption: newGasPriceOption });
};

export const gasUpdateCustomValues = (
  price: BigNumberish,
  network: Network
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { legacyGasFees, gasLimit } = getState().gas;

  const estimateInMinutes = isL2Network(network)
    ? 0.5
    : await getEstimatedTimeForGasPrice(price);
  const newGasPrices = { ...legacyGasFees };
  newGasPrices[CUSTOM] = defaultGasPriceFormat(
    CUSTOM,
    estimateInMinutes,
    price
  );

  await dispatch({
    payload: {
      legacyGasFees: newGasPrices,
    },
    type: GAS_PRICES_SUCCESS,
  });

  dispatch(gasUpdateTxFee(network, gasLimit));
};

export const gasUpdateDefaultGasLimit = (
  network: Network,
  defaultGasLimit = ethUnits.basic_tx
) => (dispatch: AppDispatch) => {
  dispatch({
    payload: defaultGasLimit,
    type: GAS_UPDATE_DEFAULT_GAS_LIMIT,
  });
  dispatch(gasUpdateTxFee(network, defaultGasLimit));
};

export const gasUpdateTxFee = (
  network: Network,
  gasLimit: number,
  overrideGasOption?: string
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    defaultGasLimit,
    legacyGasFees,
    gasFees,
    selectedGasFee,
  } = getState().gas;
  const _gasLimit = gasLimit || defaultGasLimit;
  const _selectedGasPriceOption =
    overrideGasOption || selectedGasFee.option || NORMAL;

  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;
  let nativeTokenPriceUnit = ethereumUtils.getEthPriceUnit();
  if (network === networkTypes.polygon) {
    nativeTokenPriceUnit = ethereumUtils.getMaticPriceUnit();
  }
  if (isEIP1559SupportedNetwork(network)) {
    const gasParams = gasFees;
    if (isEmpty(gasParams)) return;
    const parseFees = parseEip1559TxFees;
    const getSelectedGasParams = getSelectedGasFee;
    const txFees = parseFees(
      gasParams,
      nativeTokenPriceUnit,
      _gasLimit,
      nativeCurrency
    );
    const selectedGasParams = getSelectedGasParams(
      assets,
      gasParams,
      txFees,
      _selectedGasPriceOption
    );
    dispatch({
      payload: {
        ...selectedGasParams,
        gasLimit,
        txFees,
      },
      type: GAS_UPDATE_TX_FEE,
    });
  } else {
    const gasParams = legacyGasFees;
    if (isEmpty(gasParams)) return;
    const parseFees = parseTxFees;
    const getSelectedGasParams = getLegacySelectedGasFee;
    const txFees = parseFees(
      gasParams,
      nativeTokenPriceUnit,
      _gasLimit,
      nativeCurrency
    );
    const selectedGasParams = getSelectedGasParams(
      assets,
      gasParams,
      txFees,
      _selectedGasPriceOption,
      network
    );
    dispatch({
      payload: {
        ...selectedGasParams,
        gasLimit,
        txFees,
      },
      type: GAS_UPDATE_TX_FEE,
    });
  }
};

const getSelectedGasFee = (
  assets: any[],
  gasFees: EstimatedGasFees,
  txFees: TxFees,
  selectedGasPriceOption: string
): { isSufficientGas: boolean; selectedGasFee: SelectedGasFee } => {
  let txFee = txFees[selectedGasPriceOption];
  // If no custom price is set we default to FAST
  if (
    selectedGasPriceOption === gasUtils.CUSTOM &&
    get(txFee, 'txFee.gasPrice.amount') === 'NaN'
  ) {
    txFee = txFees[gasUtils.FAST];
  }
  const nativeAssetAddress = ETH_ADDRESS;
  const nativeAsset = ethereumUtils.getAsset(assets, nativeAssetAddress);

  const balanceAmount = get(nativeAsset, 'balance.amount', 0);
  const txFeeAmount = fromWei(get(txFee, 'maxTxFee.value.amount', 0));

  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
  const selectedGasParams = gasFees[selectedGasPriceOption];

  return {
    isSufficientGas,
    selectedGasFee: {
      ...selectedGasParams,
      gasFeeParams: {
        maxFeePerGas: selectedGasParams?.maxFeePerGas.amount,
        maxPriorityFeePerGas: selectedGasParams?.priorityFeePerGas.amount,
      },
      txFee: txFee.maxTxFee,
      value: txFee.baseTxFee.value.display,
    },
  };
};

const getLegacySelectedGasFee = (
  assets: any[],
  legacyGasFees: EstimatedLegacyGasFees,
  txFees: LegacyTxFees,
  selectedGasPriceOption: string,
  network: Network
): { isSufficientGas: boolean; selectedGasFee: SelectedGasFee } => {
  let txFee = txFees[selectedGasPriceOption];
  // If no custom price is set we default to FAST
  if (
    selectedGasPriceOption === gasUtils.CUSTOM &&
    get(txFee, 'txFee.gasPrice.amount') === 'NaN'
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
  const txFeeAmount = fromWei(get(txFee, 'txFee.gasPrice.amount', 0));
  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);
  const selectedGasParams = legacyGasFees[selectedGasPriceOption];
  return {
    isSufficientGas,
    selectedGasFee: {
      ...selectedGasParams,
      gasFeeParams: { gasPrice: selectedGasParams?.gasPrice?.amount },
      txFee: txFee.txFee,
      value: txFee.txFee.value.display,
    },
  };
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
  gasFees: {},
  gasLimit: null,
  gasParams: {},
  isSufficientGas: null,
  legacyGasFees: {},
  selectedGasFee: {} as SelectedGasFee,
  txFees: {},
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
        gasFees: action.payload.gasFees,
        legacyGasFees: action.payload.legacyGasFees,
        selectedGasFee: action.payload.selectedGasFee,
        txFees: action.payload.txFees,
      };
    case GAS_PRICES_SUCCESS:
      return {
        ...state,
        gasFees: action.payload.gasFees,
        legacyGasFees: action.payload.legacyGasFees,
      };
    case GAS_PRICES_FAILURE:
      return {
        ...state,
        legacyGasFees: action.payload,
      };
    case GAS_UPDATE_TX_FEE:
      return {
        ...state,
        gasLimit: action.payload.gasLimit,
        isSufficientGas: action.payload.isSufficientGas,
        selectedGasFee: action.payload.selectedGasFee,
        txFees: action.payload.txFees,
      };
    case GAS_UPDATE_GAS_PRICE_OPTION:
      return {
        ...state,
        isSufficientGas: action.payload.isSufficientGas,
        selectedGasFee: action.payload.selectedGasFee,
      };
    case GAS_PRICES_RESET:
      return INITIAL_STATE;
    default:
      return state;
  }
};
