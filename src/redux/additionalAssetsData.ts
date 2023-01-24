import { EthereumAddress } from '@rainbow-me/swaps';
import { captureException } from '@sentry/react-native';
import { dataUpdateAsset } from './data';
import { ParsedAddressAsset, SwappableAsset } from '@/entities';
import { getOnchainAssetBalance } from '@/handlers/assets';
import { getProviderForNetwork, isL2Network } from '@/handlers/web3';
import { Network } from '@/helpers';
import { AppDispatch, AppGetState } from '@/redux/store';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';

// -- Constants ------------------------------------------------------------- //
const ADDITIONAL_ASSET_DATA_UPDATE_L2_ASSETS_TO_WATCH =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_UPDATE_L2_ASSETS_TO_WATCH';
const ADDITIONAL_ASSET_DATA_DELETE_L2_ASSETS_TO_WATCH =
  'additionalAssetData/ADDITIONAL_ASSET_DATA_DELETE_L2_ASSETS_TO_WATCH';

type AdditionalAssetDataUpdateL2AssetToWatch = {
  type: typeof ADDITIONAL_ASSET_DATA_UPDATE_L2_ASSETS_TO_WATCH;
  payload: L2AssetToWatch;
};
type AdditionalAssetDataDeleteL2AssetToWatch = {
  type: typeof ADDITIONAL_ASSET_DATA_DELETE_L2_ASSETS_TO_WATCH;
  payload: L2AssetsToWatch;
};

type AdditionalAssetDataAction =
  | AdditionalAssetDataUpdateL2AssetToWatch
  | AdditionalAssetDataDeleteL2AssetToWatch;

type L2AssetToWatch = {
  inputCurrency: SwappableAsset;
  outputCurrency: SwappableAsset;
  userAddress: string;
  network: Network;
  id: string;
};
type L2AssetsToWatch = {
  [key: string]: L2AssetToWatch;
};

export interface AdditionalAssetsDataState {
  l2AssetsToWatch: L2AssetsToWatch;
}

// -- Actions --------------------------------------------------------------- //
export const additionalDataUpdateL2AssetToWatch = (data: {
  inputCurrency: SwappableAsset;
  outputCurrency: SwappableAsset;
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
    logger.sentry('Error watching L2 swap balances');
    captureException(e);
  }
};

const getUpdatedL2AssetBalance = async (
  asset: SwappableAsset,
  genericAssets: {
    [assetAddress: string]: ParsedAddressAsset;
  },
  network: Network,
  userAddress: EthereumAddress
) => {
  const provider = await getProviderForNetwork(network);
  const assetBalance = await getOnchainAssetBalance(
    asset,
    userAddress,
    network,
    provider
  );
  const uniqueId = `${asset.address?.toLowerCase()}_${network}`;
  const fallbackAsset =
    ethereumUtils.getAccountAsset(uniqueId) ||
    ethereumUtils.getAccountAsset(asset?.mainnet_address) ||
    genericAssets[asset?.address] ||
    (asset?.mainnet_address && genericAssets[asset?.mainnet_address]);
  return {
    ...fallbackAsset,
    ...asset,
    balance: {
      ...(fallbackAsset?.balance || {}),
      ...(assetBalance || {}),
    },
    id: asset.address,
    type: network,
    uniqueId,
  };
};

export const additionalDataUpdateL2AssetBalance = (tx: any) => async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  try {
    const { genericAssets } = getState().data;
    const { l2AssetsToWatch } = getState().additionalAssetsData;
    const network = tx.chainId
      ? ethereumUtils.getNetworkFromChainId(tx.chainId)
      : tx.network || Network.mainnet;
    const id = `${tx.hash}_${network}`;
    const assetsToUpdate = l2AssetsToWatch?.[id];
    if (!assetsToUpdate) return;
    const { inputCurrency, outputCurrency, userAddress } = assetsToUpdate;
    const inputCurrencyNetwork = ethereumUtils.getNetworkFromType(
      inputCurrency?.type
    );
    const outputCurrencyNetwork = ethereumUtils.getNetworkFromType(
      outputCurrency?.type
    );
    const updatedAssets = [
      isL2Network(inputCurrencyNetwork)
        ? await getUpdatedL2AssetBalance(
            inputCurrency,
            genericAssets,
            inputCurrencyNetwork,
            userAddress
          )
        : null,
      isL2Network(outputCurrencyNetwork)
        ? await getUpdatedL2AssetBalance(
            outputCurrency,
            genericAssets,
            outputCurrencyNetwork,
            userAddress
          )
        : null,
    ];

    updatedAssets.forEach(asset => asset && dispatch(dataUpdateAsset(asset)));

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
    logger.sentry('Error patching L2 balances');
    captureException(e);
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_UNIQUE_TOKENS_STATE = {
  l2AssetsToWatch: {},
};

export default (
  state: AdditionalAssetsDataState = INITIAL_UNIQUE_TOKENS_STATE,
  action: AdditionalAssetDataAction
) => {
  switch (action.type) {
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
