import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { createSelector } from 'reselect';
import { parseAssetsNativeWithTotals } from '@/parsers';

const EMPTY_ARRAY: any = [];

const accountAssetsDataSelector = (state: any) => state.data.accountAssetsData;
const isLoadingAssetsSelector = (state: any) => state.data.isLoadingAssets;
const nativeCurrencySelector = (state: any) => state.settings.nativeCurrency;

const sortAssetsByNativeAmount = (
  accountAssetsData: any,
  isLoadingAssets: any,
  nativeCurrency: any
) => {
  let assetsNativePrices = Object.values(accountAssetsData);

  let total = null;
  if (!isEmpty(assetsNativePrices)) {
    const parsedAssets = parseAssetsNativeWithTotals(
      assetsNativePrices,
      nativeCurrency
    );
    assetsNativePrices = parsedAssets.assetsNativePrices;
    total = parsedAssets.total;
  }
  const {
    hasValue = EMPTY_ARRAY,
    noValue = EMPTY_ARRAY,
  } = groupAssetsByMarketValue(assetsNativePrices);

  const sortedAssetsNoShitcoins = hasValue.sort((a: any, b: any) => {
    let itemA = Number(a.native?.balance?.amount) ?? 0;
    let itemB = Number(b.native?.balance?.amount) ?? 0;

    return itemA < itemB ? 1 : -1;
  });

  const sortedShitcoins = noValue.sort((a: any, b: any) => {
    let itemA = a.name;
    let itemB = b.name;

    return itemA > itemB ? 1 : -1;
  });

  const sortedAssets = sortedAssetsNoShitcoins.concat(sortedShitcoins);

  return {
    assetsTotal: total,
    isBalancesSectionEmpty: isEmpty(sortedAssets),
    isLoadingAssets,
    sortedAssets,
    sortedAssetsCount: sortedAssets.length,
  };
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

export const sortAssetsByNativeAmountSelector = createSelector(
  [accountAssetsDataSelector, isLoadingAssetsSelector, nativeCurrencySelector],
  sortAssetsByNativeAmount
);
