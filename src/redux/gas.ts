import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { isEmpty } from 'lodash';
import { AnyAction } from 'redux';
import {
  Asset,
  GasPrices,
  GasSpeedOption,
  SelectedGasPrice,
  TxFees,
} from '@rainbow-me/entities';
import {
  etherscanGetGasEstimates,
  etherscanGetGasPrices,
  ethGasStationGetGasPrices,
  getEstimatedTimeForGasPrice,
  maticGasStationGetGasPrices,
  maticGetGasEstimates,
} from '@rainbow-me/handlers/gasPrices';
import { getProviderForNetwork, isL2Network } from '@rainbow-me/handlers/web3';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  defaultGasPriceFormat,
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
import { AppDispatch, AppGetState } from '@rainbow-me/redux/store';
import { fromWei, greaterThanOrEqualTo, multiply } from '@rainbow-me/utilities';
import { ethereumUtils, gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

interface GasState {
  defaultGasLimit: number;
  gasLimit: string | number | null;
  gasPrices: GasPrices | {};
  gasSpeedOption: GasSpeedOption;
  isSufficientGas?: boolean;
  selectedGasPrice: SelectedGasPrice | {};
  txFees: TxFees | {};
}

// -- Constants ------------------------------------------------------------- //
const OPTIMISM_GAS_PRICE_GWEI = 0.015;
const GAS_UPDATE_DEFAULT_GAS_LIMIT = 'gas/GAS_UPDATE_DEFAULT_GAS_LIMIT';
const GAS_PRICES_SUCCESS = 'gas/GAS_PRICES_SUCCESS';

const GAS_PRICES_RESET = 'gas/GAS_PRICES_RESET';
const GAS_UPDATE_TX_FEE = 'gas/GAS_UPDATE_TX_FEE';
const GAS_UPDATE_GAS_PRICE_OPTION = 'gas/GAS_UPDATE_GAS_PRICE_OPTION';

// -- Actions --------------------------------------------------------------- //
let gasPricesHandle: number | null = null;

const { GAS_PRICE_SOURCES } = gasUtils;

export const updateGasPriceForSpeed = (
  speed: GasSpeedOption,
  newPrice: string
) => async (dispatch: AppDispatch, getState: AppGetState) => {
  const { gasPrices } = getState().gas;

  const newGasPrices = { ...gasPrices };
  newGasPrices[speed].value = {
    amount: newPrice,
    display: `${newPrice} Gwei`,
  };

  dispatch({
    payload: {
      gasPrices: newGasPrices,
    },
    type: GAS_PRICES_SUCCESS,
  });
};

export const gasPricesStartPolling = (network: Network = Network.mainnet) => async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  dispatch(gasPricesStopPolling());

  const getPolygonGasPrices = async () => {
    const { data: maticGasStationPrices } = await maticGasStationGetGasPrices();

    // Override required to make it compatible with other responses
    maticGasStationPrices['average'] = maticGasStationPrices['standard'];
    delete maticGasStationPrices['standard'];

    return maticGetGasEstimates(maticGasStationPrices);
  };

  const getArbitrumGasPrices = async () => {
    const provider = await getProviderForNetwork(Network.arbitrum);
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

  const getGasPrices = () =>
    new Promise(async (fetchResolve, fetchReject) => {
      try {
        const { gasPrices: existingGasPrice } = getState().gas;

        let adjustedGasPrices;
        let source = GAS_PRICE_SOURCES.ETHERSCAN;
        if (network === Network.polygon) {
          source = GAS_PRICE_SOURCES.MATIC_GAS_STATION;
          adjustedGasPrices = await getPolygonGasPrices();
        } else if (network === Network.arbitrum) {
          source = GAS_PRICE_SOURCES.ARBITRUM_NODE;
          adjustedGasPrices = await getArbitrumGasPrices();
        } else if (network === Network.optimism) {
          source = GAS_PRICE_SOURCES.OPTIMISM_NODE;
          adjustedGasPrices = await getOptimismGasPrices();
        } else {
          try {
            // Use etherscan as our Gas Price Oracle
            const {
              data: { result: etherscanGasPrices },
            } = await etherscanGetGasPrices();

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
            adjustedGasPrices = ethGasStationPrices;
          }
        }

        let gasPrices = parseGasPrices(adjustedGasPrices, source);
        if (gasPrices && existingGasPrice[GasSpeedOption.CUSTOM] !== null) {
          // Preserve custom values while updating prices
          gasPrices[GasSpeedOption.CUSTOM] =
            existingGasPrice[GasSpeedOption.CUSTOM];
        }

        if (gasPrices) {
          dispatch({
            payload: {
              gasPrices,
            },
            type: GAS_PRICES_SUCCESS,
          });
          fetchResolve(true);
        } else {
          fetchReject(new Error('Both gas price sources failed'));
        }
      } catch (error) {
        captureException(new Error('all gas estimates failed'));
        logger.sentry('gas estimates error', error);
        fetchReject(error);
      }
    });

  const watchGasPrices = async () => {
    try {
      await getGasPrices();
      // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      gasPricesHandle = setTimeout(() => {
        watchGasPrices();
      }, 15000); // 15 secs
    }
  };

  watchGasPrices();
};

export const gasUpdateGasSpeedOption = (
  newGasSpeedOption: GasSpeedOption,
  network: Network,
  assetsOverride?: Asset[]
) => (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  const { gasPrices, txFees } = getState().gas;
  if (isEmpty(gasPrices)) return;
  const { assets } = getState().data;
  const results = getSelectedGasPrice(
    assetsOverride || assets,
    gasPrices,
    txFees,
    newGasSpeedOption,
    network
  );

  dispatch({
    payload: {
      ...results,
      gasSpeedOption: newGasSpeedOption,
    },
    type: GAS_UPDATE_GAS_PRICE_OPTION,
  });
  analytics.track('Updated Gas Speed', { gasSpeedOption: newGasSpeedOption });
};

export const gasUpdateCustomValues = (price: string, network: Network) => async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  const { gasPrices, gasLimit } = getState().gas;

  const estimateInMinutes = isL2Network(network)
    ? 0.5
    : await getEstimatedTimeForGasPrice(price);
  const newGasPrices = { ...gasPrices };
  newGasPrices[GasSpeedOption.CUSTOM] = defaultGasPriceFormat(
    GasSpeedOption.CUSTOM,
    estimateInMinutes,
    price
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
  gasLimit: string | number,
  overrideGasOption?: GasSpeedOption
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { defaultGasLimit, gasPrices, gasSpeedOption } = getState().gas;
  const _gasLimit = gasLimit || defaultGasLimit;
  const _newGasSpeedOption = overrideGasOption || gasSpeedOption;
  if (isEmpty(gasPrices)) return;
  const { assets } = getState().data;
  const { nativeCurrency } = getState().settings;
  let nativeTokenPriceUnit = ethereumUtils.getEthPriceUnit();
  if (network === Network.polygon) {
    nativeTokenPriceUnit = ethereumUtils.getMaticPriceUnit();
  }

  const txFees = parseTxFees(
    gasPrices,
    nativeTokenPriceUnit,
    _gasLimit,
    nativeCurrency
  );

  const results = getSelectedGasPrice(
    assets,
    gasPrices,
    txFees,
    _newGasSpeedOption,
    network
  );

  dispatch({
    payload: {
      ...results,
      gasLimit: _gasLimit,
      txFees,
    },
    type: GAS_UPDATE_TX_FEE,
  });
};

const getSelectedGasPrice = (
  assets: Asset[],
  gasPrices: GasPrices,
  txFees: TxFees,
  gasSpeedOption: GasSpeedOption,
  network: Network
) => {
  let txFee = txFees[gasSpeedOption];
  // If no custom price is set we default to FAST
  if (
    gasSpeedOption === GasSpeedOption.CUSTOM &&
    txFee?.txFee?.value?.amount === 'NaN'
  ) {
    txFee = txFees[GasSpeedOption.FAST];
  }
  let nativeAssetAddress;

  switch (network) {
    case Network.polygon:
      nativeAssetAddress = MATIC_POLYGON_ADDRESS;
      break;
    case Network.arbitrum:
      nativeAssetAddress = ARBITRUM_ETH_ADDRESS;
      break;
    case Network.optimism:
      nativeAssetAddress = OPTIMISM_ETH_ADDRESS;
      break;
    default:
      nativeAssetAddress = ETH_ADDRESS;
  }

  const nativeAsset = ethereumUtils.getAsset(assets, nativeAssetAddress);

  const balanceAmount = nativeAsset?.balance?.amount ?? 0;
  const txFeeAmount = fromWei(txFee?.txFee?.value?.amount ?? 0);
  const isSufficientGas = greaterThanOrEqualTo(balanceAmount, txFeeAmount);

  return {
    isSufficientGas,
    selectedGasPrice: {
      ...txFee,
      ...gasPrices[gasSpeedOption],
    },
  };
};

export const gasPricesStopPolling = () => (dispatch: AppDispatch) => {
  gasPricesHandle && clearTimeout(gasPricesHandle);
  dispatch({
    type: GAS_PRICES_RESET,
  });
};

// -- Reducer --------------------------------------------------------------- //
const INITIAL_STATE: GasState = {
  defaultGasLimit: ethUnits.basic_tx,
  gasLimit: null,
  gasPrices: {},
  gasSpeedOption: GasSpeedOption.NORMAL,
  isSufficientGas: undefined,
  selectedGasPrice: {},
  txFees: {},
};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case GAS_UPDATE_DEFAULT_GAS_LIMIT:
      return {
        ...state,
        defaultGasLimit: action.payload,
      };
    case GAS_PRICES_SUCCESS:
      return {
        ...state,
        gasPrices: action.payload.gasPrices,
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
        gasSpeedOption: action.payload.gasSpeedOption,
        isSufficientGas: action.payload.isSufficientGas,
        selectedGasPrice: action.payload.selectedGasPrice,
      };
    case GAS_PRICES_RESET:
      return INITIAL_STATE;
    default:
      return state;
  }
};
