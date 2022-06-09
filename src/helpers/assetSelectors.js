import { get, groupBy, isEmpty, isNil, mapValues, toNumber } from 'lodash';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import { parseAssetsNative } from '@rainbow-me/parsers';
import { add, convertAmountToNativeDisplay } from '@rainbow-me/utilities';
const EMPTY_ARRAY = [];

const assetPricesFromUniswapSelector = state =>
  state.data.assetPricesFromUniswap;
const assetsDataSelector = state => state.data.assetsData;
const isLoadingAssetsSelector = state => state.data.isLoadingAssets;
const nativeCurrencySelector = state => state.settings.nativeCurrency;

const filterAssetsByBalance = (
  assetsData,
  assetPricesFromUniswap,
  nativeCurrency
) => {
  let updatedAssets = assetsData;
  if (!isEmpty(assetPricesFromUniswap)) {
    updatedAssets = mapValues(assetsData, asset => {
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
  const parsedAssetsWithNative = parseAssetsNative(
    updatedAssets,
    nativeCurrency
  );
  return parsedAssetsWithNative.filter(({ native }) => !isNil(native?.balance));
};

export const filterAssetsByBalanceSelector = createSelector(
  [assetsDataSelector, assetPricesFromUniswapSelector, nativeCurrencySelector],
  filterAssetsByBalance
);

const sortAssetsByNativeAmount = (
  assetsWithBalance,
  isLoadingAssets,
  nativeCurrency
) => {
  let totalAmount = 0;
  for (const asset of assetsWithBalance) {
    totalAmount = add(totalAmount, asset.native?.balance?.amount ?? 0);
  }
  const totalDisplay = convertAmountToNativeDisplay(
    totalAmount,
    nativeCurrency
  );
  const total = { amount: totalAmount, display: totalDisplay };
  const {
    hasValue = EMPTY_ARRAY,
    noValue = EMPTY_ARRAY,
  } = groupAssetsByMarketValue(assetsWithBalance);

  const sortedAssetsNoShitcoins = sortList(
    hasValue,
    'native.balance.amount',
    'desc',
    0,
    toNumber
  );
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

const groupAssetsByMarketValue = assets =>
  groupBy(assets, ({ native }) => (isNil(native) ? 'noValue' : 'hasValue'));

export const sortAssetsByNativeAmountSelector = createSelector(
  [
    filterAssetsByBalanceSelector,
    isLoadingAssetsSelector,
    nativeCurrencySelector,
  ],
  sortAssetsByNativeAmount
);
