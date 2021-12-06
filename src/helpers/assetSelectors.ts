import { filter, get, groupBy, isEmpty, isNil, map, toNumber } from 'lodash';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
import { parseAssetsNativeWithTotals } from '@rainbow-me/parsers';

const EMPTY_ARRAY: any = [];

const assetPricesFromUniswapSelector = (state: any) =>
  state.data.assetPricesFromUniswap;
const assetsSelector = (state: any) => state.data.assets;
const isLoadingAssetsSelector = (state: any) => state.data.isLoadingAssets;
const nativeCurrencySelector = (state: any) => state.settings.nativeCurrency;
const hiddenCoinsSelector = (state: any) => state.editOptions.hiddenCoins;

const sortAssetsByNativeAmount = (
  originalAssets: any,
  assetPricesFromUniswap: any,
  isLoadingAssets: any,
  nativeCurrency: any,
  hiddenCoins: any
) => {
  let updatedAssets = originalAssets;
  if (!isEmpty(assetPricesFromUniswap)) {
    updatedAssets = map(originalAssets, asset => {
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
  let assetsNativePrices = updatedAssets;
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

  const sortedAssets = sortList(
    hasValue,
    'native.balance.amount',
    'desc',
    0,
    toNumber
  );
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 5 arguments, but got 3.
  const sortedShitcoins = sortList(noValue, 'name', 'asc');
  const allAssets = sortedAssets.concat(sortedShitcoins);
  const allAssetsWithoutHidden = filter(
    allAssets,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'uniqueId' does not exist on type 'never'... Remove this comment to see the full error message
    asset => hiddenCoins && !hiddenCoins.includes(asset.uniqueId)
  );

  return {
    allAssets,
    allAssetsCount: allAssets.length,
    allAssetsWithoutHidden,
    assetPricesFromUniswap,
    assets: sortedAssets,
    assetsCount: sortedAssets.length,
    assetsTotal: total,
    isBalancesSectionEmpty: isEmpty(allAssets),
    isLoadingAssets,
    nativeCurrency,
    shitcoins: sortedShitcoins,
    shitcoinsCount: sortedShitcoins.length,
  };
};

const groupAssetsByMarketValue = (assets: any) =>
  groupBy(assets, ({ native }) => (isNil(native) ? 'noValue' : 'hasValue'));

export const sortAssetsByNativeAmountSelector = createSelector(
  [
    assetsSelector,
    assetPricesFromUniswapSelector,
    isLoadingAssetsSelector,
    nativeCurrencySelector,
    hiddenCoinsSelector,
  ],
  sortAssetsByNativeAmount
);
