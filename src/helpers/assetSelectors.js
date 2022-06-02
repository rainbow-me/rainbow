import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { createSelector } from 'reselect';
import { parseAssetsNativeWithTotals } from '@rainbow-me/parsers';

const EMPTY_ARRAY = [];

const assetPricesFromUniswapSelector = state =>
  state.data.assetPricesFromUniswap;
const accountAssetsDataSelector = state => state.data.accountAssetsData;
const isLoadingAssetsSelector = state => state.data.isLoadingAssets;
const nativeCurrencySelector = state => state.settings.nativeCurrency;

const sortAssetsByNativeAmount = (
  accountAssetsData,
  assetPricesFromUniswap,
  isLoadingAssets,
  nativeCurrency
) => {
  let assetsNativePrices = Object.values(accountAssetsData);

  if (!isEmpty(assetPricesFromUniswap)) {
    assetsNativePrices = assetsNativePrices.map(asset => {
      if (isNil(asset.price)) {
        const assetPrice = assetPricesFromUniswap[asset.address]?.price;

        const relativePriceChange =
          assetPricesFromUniswap[asset.address]?.relativePriceChange;
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

  const sortedAssetsNoShitcoins = hasValue.sort((a, b) => {
    let itemA = Number(a.native?.balance?.amount) ?? 0;
    let itemB = Number(b.native?.balance?.amount) ?? 0;

    return itemA < itemB ? 1 : -1;
  });

  const sortedShitcoins = noValue.sort((a, b) => {
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

const groupAssetsByMarketValue = assets =>
  assets.reduce(
    (acc, asset) => {
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
  [
    accountAssetsDataSelector,
    assetPricesFromUniswapSelector,
    isLoadingAssetsSelector,
    nativeCurrencySelector,
  ],
  sortAssetsByNativeAmount
);
