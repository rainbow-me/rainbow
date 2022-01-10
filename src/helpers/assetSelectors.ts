import {
  get,
  groupBy,
  isEmpty,
  isNil,
  mapValues,
  toNumber,
  values,
} from 'lodash';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import { parseAssetsNativeWithTotals } from '@rainbow-me/parsers';

const EMPTY_ARRAY: any = [];

const assetPricesFromUniswapSelector = (state: any) =>
  state.data.assetPricesFromUniswap;
const accountAssetsDataSelector = (state: any) => state.data.accountAssetsData;
const isLoadingAssetsSelector = (state: any) => state.data.isLoadingAssets;
const nativeCurrencySelector = (state: any) => state.settings.nativeCurrency;

const sortAssetsByNativeAmount = (
  accountAssetsData: any,
  assetPricesFromUniswap: any,
  isLoadingAssets: any,
  nativeCurrency: any
) => {
  let updatedAssets = accountAssetsData;
  if (!isEmpty(assetPricesFromUniswap)) {
    updatedAssets = mapValues(accountAssetsData, asset => {
      if (isNil(asset.price)) {
        const assetPrice = get(
          assetPricesFromUniswap,
          `[${asset.address}].price`
        );
        const relativePriceChange = get(
          assetPricesFromUniswap,
          `[${asset.address}].relativePriceChange`
        );
        if (assetPrice) {
          return {
            ...asset,
            price: {
              relative_change_24h: relativePriceChange,
              value: assetPrice,
            },
          };
        }
      }
      return asset;
    });
  }
  let assetsNativePrices = values(updatedAssets);
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

  const sortedAssetsNoShitcoins = sortList(
    hasValue,
    'native.balance.amount',
    'desc',
    0,
    toNumber
  );
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 5 arguments, but got 3.
  const sortedShitcoins = sortList(noValue, 'name', 'asc');
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
  groupBy(assets, ({ native }) => (isNil(native) ? 'noValue' : 'hasValue'));

export const sortAssetsByNativeAmountSelector = createSelector(
  [
    accountAssetsDataSelector,
    assetPricesFromUniswapSelector,
    isLoadingAssetsSelector,
    nativeCurrencySelector,
  ],
  sortAssetsByNativeAmount
);
