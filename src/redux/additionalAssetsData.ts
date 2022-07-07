import { EthereumAddress } from '@rainbow-me/swaps';
import { dataUpdateAsset } from './data';
import { getOnchainAssetBalance } from '@rainbow-me/handlers/assets';
import { getCoingeckoIds } from '@rainbow-me/handlers/dispersion';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import { Network } from '@rainbow-me/helpers';
import { AppDispatch, AppGetState, AppState } from '@rainbow-me/redux/store';
import { ETH_ADDRESS } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

// -- Constants ------------------------------------------------------------- //
const ADDITIONAL_ASSET_DATA_COINGECKO_IDS =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_COINGOCKO_IDS';
const ADDITIONAL_ASSET_DATA_UPDATE_L2_ASSETS_TO_WATCH =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_UPDATE_L2_ASSETS_TO_WATCH';
const ADDITIONAL_ASSET_DATA_DELETE_L2_ASSETS_TO_WATCH =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_DELETE_L2_ASSETS_TO_WATCH';

type AdditionalAssetCoingeckoIdsAction = {
  type: typeof ADDITIONAL_ASSET_DATA_COINGECKO_IDS;
  payload: CoingeckoMappingState;
};
type AdditionalAssetDataUpdateL2AssetToWatch = {
  type: typeof ADDITIONAL_ASSET_DATA_UPDATE_L2_ASSETS_TO_WATCH;
  payload: L2AssetToWatch;
};
type AdditionalAssetDataDeleteL2AssetToWatch = {
  type: typeof ADDITIONAL_ASSET_DATA_DELETE_L2_ASSETS_TO_WATCH;
  payload: L2AssetsToWatch;
};

type AdditionalAssetDataAction =
  | AdditionalAssetCoingeckoIdsAction
  | AdditionalAssetDataUpdateL2AssetToWatch
  | AdditionalAssetDataDeleteL2AssetToWatch;

type L2AssetToWatch = {
  inputCurrency: {
    address: EthereumAddress;
    decimals: number;
    mainnetAddress: EthereumAddress;
    symbol: string;
  };
  outputCurrency: {
    address: EthereumAddress;
    decimals: number;
    mainnetAddress: EthereumAddress;
    symbol: string;
  };
  userAddress: string;
  network: Network;
  id: string;
};
type L2AssetsToWatch = {
  [key: string]: L2AssetToWatch;
};
type CoingeckoMappingState = {
  [key: string]: string;
};

export interface AdditionalAssetsDataState {
  l2AssetsToWatch: L2AssetsToWatch;
  coingeckoIds: CoingeckoMappingState;
}

// -- Actions --------------------------------------------------------------- //
export const additionalDataCoingeckoIds = async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
  // @ts-ignore
  if (Object.keys(getState().additionalAssetsData.coingeckoIds).length === 0) {
    const idMap = await getCoingeckoIds();
    if (idMap) {
      idMap[ETH_ADDRESS] = 'ethereum';
      dispatch({ payload: idMap, type: ADDITIONAL_ASSET_DATA_COINGECKO_IDS });
    }
  }
};

export const additionalDataUpdateL2AssetToWatch = (data: {
  inputCurrency: {
    address: EthereumAddress;
    decimals: number;
    mainnetAddress: EthereumAddress;
    symbol: string;
  };
  outputCurrency: {
    address: EthereumAddress;
    decimals: number;
    mainnetAddress: EthereumAddress;
    symbol: string;
  };
  userAddress: string;
  network: Network;
  hash: string;
}) => async (dispatch: AppDispatch) => {
  try {
    dispatch({
      payload: {
        ...data,
        id: `${data.hash}_${data.network}`,
      },
      type: ADDITIONAL_ASSET_DATA_UPDATE_L2_ASSETS_TO_WATCH,
    });
  } catch (e) {
    logger.debug('EXCEPTION: UPDATE SWAP L2 BALANCES TO UPDATE: --- ', e);
  }
};

export const additionalDataUpdateL2AssetBalance = (tx: any) => async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  try {
    const { l2AssetsToWatch } = getState().additionalAssetsData;
    const { genericAssets } = getState().data;
    const network = tx.chainId
      ? ethereumUtils.getNetworkFromChainId(tx.chainId)
      : tx.network || Network.mainnet;
    const id = `${tx.hash}_${network}`;
    const assetToUpdate = l2AssetsToWatch?.[id];
    if (!assetToUpdate) return;
    const { inputCurrency, outputCurrency, userAddress } = assetToUpdate;
    const provider = await getProviderForNetwork(network);
    const inputAssetBalance = await getOnchainAssetBalance(
      inputCurrency,
      userAddress,
      network,
      provider
    );
    const inputUniqueId = `${inputCurrency.address?.toLowerCase()}_${network}`;
    const inputFallback =
      ethereumUtils.getAccountAsset(
        inputCurrency.mainnetAddress.toLowerCase()
      ) || genericAssets[inputCurrency.mainnetAddress?.toLowerCase()];
    if (inputAssetBalance && inputFallback) {
      const updatedInputToken = {
        ...inputFallback,
        address: inputCurrency.address,
        balance: {
          ...(inputFallback?.balance || {}),
          ...inputAssetBalance,
        },
        mainnet_address: inputCurrency.mainnetAddress.toLowerCase(),
        type: network,
        uniqueId: inputUniqueId,
      };
      dispatch(dataUpdateAsset(updatedInputToken));
    }
    const outputAssetBalance = await getOnchainAssetBalance(
      outputCurrency,
      userAddress,
      network,
      provider
    );
    const outputUniqueId = `${outputCurrency.address?.toLowerCase()}_${network}`;
    const outputFallback =
      ethereumUtils.getAccountAsset(
        outputCurrency.mainnetAddress.toLowerCase()
      ) || genericAssets[outputCurrency.mainnetAddress?.toLowerCase()];
    if (outputAssetBalance && outputFallback) {
      const updatedOutputToken = {
        ...outputFallback,
        address: outputCurrency.address,
        balance: {
          ...(outputFallback?.balance || {}),
          ...outputAssetBalance,
        },
        mainnet_address: outputCurrency.mainnetAddress.toLowerCase(),
        type: network,
        uniqueId: outputUniqueId,
      };
      dispatch(dataUpdateAsset(updatedOutputToken));
    }

    const newL2AssetsToWatch = Object.entries(l2AssetsToWatch).reduce(
      (newData, [key, asset]) => {
        if (key !== id) {
          return { ...newData, [id]: asset };
        } else {
          return newData;
        }
      },
      {}
    );
    dispatch({
      payload: newL2AssetsToWatch,
      type: ADDITIONAL_ASSET_DATA_DELETE_L2_ASSETS_TO_WATCH,
    });
  } catch (e) {
    logger.debug('EXCEPTION IN UPDATE BALANCES: ', e);
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNIQUE_TOKENS_STATE = {
  coingeckoIds: {},
  l2AssetsToWatch: {},
};

export default (
  state: AdditionalAssetsDataState = INITIAL_UNIQUE_TOKENS_STATE,
  action: AdditionalAssetDataAction
) => {
  switch (action.type) {
    case ADDITIONAL_ASSET_DATA_COINGECKO_IDS:
      return {
        ...state,
        coingeckoIds: {
          ...state.coingeckoIds,
          ...action.payload,
        },
      };
    case ADDITIONAL_ASSET_DATA_UPDATE_L2_ASSETS_TO_WATCH:
      return {
        ...state,
        l2AssetsToWatch: {
          ...state.l2AssetsToWatch,
          [action.payload.id]: action.payload,
        },
      };
    case ADDITIONAL_ASSET_DATA_DELETE_L2_ASSETS_TO_WATCH:
      return {
        ...state,
        l2AssetsToWatch: { ...action.payload },
      };
    default:
      return state;
  }
};
