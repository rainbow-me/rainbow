import { get, groupBy, isEmpty, isNil, mapValues, toNumber } from 'lodash';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import { parseAssetsNativeWithTotals } from '@rainbow-me/parsers';
const EMPTY_ARRAY = [];

const assetPricesFromUniswapSelector = state =>
  state.data.assetPricesFromUniswap;
const accountAssetsDataSelector = state => state.data.assetsData;
const isLoadingAssetsSelector = state => state.data.isLoadingAssets;
const nativeCurrencySelector = state => state.settings.nativeCurrency;

const sortAssetsByNativeAmount = (
  assetsData,
  assetPricesFromUniswap,
  isLoadingAssets,
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
  const parsedAssets = parseAssetsNativeWithTotals(
    Object.values(updatedAssets),
    nativeCurrency
  );
  const { assetsNativePrices, total } = parsedAssets;
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
    accountAssetsDataSelector,
    assetPricesFromUniswapSelector,
    isLoadingAssetsSelector,
    nativeCurrencySelector,
  ],
  sortAssetsByNativeAmount
);
