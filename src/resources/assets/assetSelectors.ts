import { ParsedAddressAsset } from '@/entities';
import { parseAssetsNative } from '@/parsers';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { RainbowAddressAssets } from './types';

const EMPTY_ARRAY: any = [];

export function selectUserAssetWithUniqueId(uniqueId: string) {
  return (accountAssets: RainbowAddressAssets) => {
    return accountAssets?.[uniqueId];
  };
}

export function selectSortedUserAssets(nativeCurrency: string) {
  return (accountAssets: RainbowAddressAssets) => {
    return sortAssetsByNativeAmount(accountAssets, nativeCurrency);
  };
}

const sortAssetsByNativeAmount = (accountAssets: RainbowAddressAssets, nativeCurrency: string): ParsedAddressAsset[] => {
  let assetsNativePrices = Object.values(accountAssets);

  if (!isEmpty(assetsNativePrices)) {
    assetsNativePrices = parseAssetsNative(assetsNativePrices, nativeCurrency);
  }
  const { hasValue = EMPTY_ARRAY, noValue = EMPTY_ARRAY } = groupAssetsByMarketValue(assetsNativePrices);

  const sortedAssetsNoShitcoins = hasValue.sort((a: any, b: any) => {
    const itemA = Number(a.native?.balance?.amount) ?? 0;
    const itemB = Number(b.native?.balance?.amount) ?? 0;

    return itemA < itemB ? 1 : -1;
  });

  const sortedShitcoins = noValue.sort((a: any, b: any) => {
    const itemA = a.name;
    const itemB = b.name;

    return itemA > itemB ? 1 : -1;
  });

  const sortedAssets = sortedAssetsNoShitcoins.concat(sortedShitcoins);

  return sortedAssets;
};

const groupAssetsByMarketValue = (assets: any) =>
  assets.reduce(
    (acc: any, asset: any) => {
      if (isNil(asset.native)) {
        acc.noValue.push(asset);
      } else {
        acc.hasValue.push(asset);
      }

      return acc;
    },
    {
      hasValue: [],
      noValue: [],
    }
  );
