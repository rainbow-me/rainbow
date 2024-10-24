import lang from 'i18n-js';
import isEmpty from 'lodash/isEmpty';
import { MMKV } from 'react-native-mmkv';
import { NativeCurrencyKey, ParsedAddressAsset } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import { convertRawAmountToBalance } from '@/helpers/utilities';
import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { queryClient } from '@/react-query';
import { setHiddenCoins } from '@/redux/editOptions';
import store from '@/redux/store';
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';
import { RainbowPositions } from '@/resources/defi/types';
import { AddysAddressAsset, AddysAsset, ParsedAsset, RainbowAddressAssets } from './types';
import { getUniqueId } from '@/utils/ethereumUtils';
import { chainsIdByName } from '@/chains';
import { ChainId } from '@/chains/types';

const storage = new MMKV();

export const filterPositionsData = (
  address: string,
  currency: NativeCurrencyKey,
  assetsData: RainbowAddressAssets
): RainbowAddressAssets => {
  const positionsObj: RainbowPositions | undefined = queryClient.getQueryData(positionsQueryKey({ address, currency }));
  const positionTokens = positionsObj?.positionTokens || [];

  if (isEmpty(positionTokens)) {
    return assetsData;
  }

  return Object.keys(assetsData)
    .filter(uniqueId => !positionTokens.find(positionToken => positionToken === uniqueId))
    .reduce((cur, uniqueId) => {
      return Object.assign(cur, {
        [uniqueId]: assetsData[uniqueId],
      });
    }, {});
};

export function parseAsset({ address, asset }: { address: string; asset: AddysAsset }): ParsedAsset {
  const network = asset?.network;
  const chainId = chainsIdByName[network];
  const mainnetAddress = asset?.networks?.[ChainId.mainnet]?.address;
  const uniqueId = getUniqueId(address, chainId);

  const parsedAsset = {
    address,
    color: asset?.colors?.primary,
    colors: asset.colors,
    chainId,
    chainName: network,
    decimals: asset?.decimals,
    id: address,
    icon_url: asset?.icon_url,
    isNativeAsset: isNativeAsset(address, chainId),
    name: asset?.name || lang.t('account.unknown_token'),
    mainnet_address: mainnetAddress,
    mainnetAddress,
    network,
    networks: asset?.networks,
    price: asset?.price,
    symbol: asset?.symbol,
    type: asset?.type,
    uniqueId,
    transferable: asset?.transferable,
  };

  return parsedAsset;
}

export function parseAddressAsset({ assetData }: { assetData: AddysAddressAsset }): ParsedAddressAsset {
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
  const newHiddenCoins = [...list.filter((i: string) => !coins.includes(i)), ...coins].reduce((acc, curr) => {
    acc[curr] = true;
    return acc;
  }, {} as BooleanMap);
  dispatch(setHiddenCoins(newHiddenCoins));
  storage.set(storageKey, JSON.stringify(newHiddenCoins));
}
