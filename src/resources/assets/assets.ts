import lang from 'i18n-js';
import isValidDomain from 'is-valid-domain';
import isEmpty from 'lodash/isEmpty';
import { MMKV, NativeMMKV } from 'react-native-mmkv';
import { AssetType, NativeCurrencyKey, ParsedAddressAsset } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import { Network } from '@/helpers/networkTypes';
import { convertRawAmountToBalance } from '@/helpers/utilities';
import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { queryClient } from '@/react-query';
import { setHiddenCoins } from '@/redux/editOptions';
import store from '@/redux/store';
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';
import { RainbowPositions } from '@/resources/defi/types';
import { ethereumUtils } from '@/utils';
import {
  AddysAddressAsset,
  AddysAsset,
  ParsedAsset,
  RainbowAddressAssets,
} from './types';

const storage = new MMKV();

const MAINNET_CHAIN_ID = ethereumUtils.getChainIdFromNetwork(Network.mainnet);

export const filterPositionsData = (
  address: string,
  currency: NativeCurrencyKey,
  assetsData: RainbowAddressAssets
): RainbowAddressAssets => {
  const positionsObj: RainbowPositions | undefined = queryClient.getQueryData(
    positionsQueryKey({ address, currency })
  );
  const positionTokens = positionsObj?.positionTokens || [];

  if (isEmpty(positionTokens)) {
    return assetsData;
  }

  return Object.keys(assetsData)
    .filter(
      uniqueId =>
        !positionTokens.find(positionToken => positionToken === uniqueId)
    )
    .reduce((cur, uniqueId) => {
      return Object.assign(cur, {
        [uniqueId]: assetsData[uniqueId],
      });
    }, {});
};

export function parseAsset({
  address,
  asset,
}: {
  address: string;
  asset: AddysAsset;
}): ParsedAsset {
  const chainName = asset?.network;
  const network = chainName;
  const chainId = ethereumUtils.getChainIdFromNetwork(chainName);
  const mainnetAddress = asset?.networks?.[MAINNET_CHAIN_ID]?.address;
  const uniqueId =
    network && network !== Network.mainnet ? `${address}_${network}` : address;

  const nonMainnetNetwork = network !== Network.mainnet ? network : undefined;
  const assetType = asset?.type ?? nonMainnetNetwork ?? AssetType.token;

  const parsedAsset = {
    address,
    color: asset?.colors?.primary,
    colors: asset?.colors,
    chainId,
    chainName,
    decimals: asset?.decimals,
    id: address,
    icon_url: asset?.icon_url,
    isNativeAsset: isNativeAsset(address, chainName),
    name: asset?.name || lang.t('account.unknown_token'),
    mainnet_address: mainnetAddress,
    // mainnetAddress,
    network,
    // networks: asset?.networks,
    price: asset?.price,
    symbol: asset?.symbol,
    type: assetType,
    uniqueId,
  };

  return parsedAsset;
}

export function parseAddressAsset({
  assetData,
}: {
  assetData: AddysAddressAsset;
}): ParsedAddressAsset {
  const asset = assetData?.asset;
  const quantity = assetData?.quantity;
  const address = assetData?.asset?.asset_code;
  const parsedAsset = parseAsset({
    address,
    asset,
  });
  return {
    ...parsedAsset,
    balance: convertRawAmountToBalance(quantity, asset),
  };
}

/**
 * Adds new hidden coins for an address and updates key-value storage.
 *
 * @param coins New coin IDs.
 * @param address The address to hide coins for.
 */
function addHiddenCoins(coins: string[], address: string) {
  const { dispatch } = store;
  const storageKey = 'hidden-coins-obj-' + address;
  const storageEntity = storage.getString(storageKey);
  const list = Object.keys(storageEntity ? JSON.parse(storageEntity) : {});
  const newHiddenCoins = [
    ...list.filter((i: string) => !coins.includes(i)),
    ...coins,
  ].reduce((acc, curr) => {
    acc[curr] = true;
    return acc;
  }, {} as BooleanMap);
  dispatch(setHiddenCoins(newHiddenCoins));
  storage.set(storageKey, JSON.stringify(newHiddenCoins));
}

const getTokenUrlScams = (tokens: RainbowAddressAssets): string[] =>
  Object.values(tokens)
    .filter(
      asset =>
        ((asset?.name && isValidDomain(asset?.name.replaceAll(' ', ''))) ||
          (asset?.symbol && isValidDomain(asset.symbol))) &&
        !asset.isVerified
    )
    .map(asset => asset.uniqueId);

export const hideTokensWithUrls = (
  tokens: RainbowAddressAssets,
  address: string
) => {
  const tokensWithUrls = getTokenUrlScams(tokens);
  addHiddenCoins(tokensWithUrls, address);
};
