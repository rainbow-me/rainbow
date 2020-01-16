import { concat, get, groupBy, isEmpty, isNil, map, toNumber } from 'lodash';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplay,
} from '../helpers/utilities';
import { isLowerCaseMatch } from '../utils';

const EMPTY_ARRAY = [];

const assetsSelector = state => state.assets;
const compoundAssetsSelector = state => state.compoundAssets;
const nativeCurrencySelector = state => state.nativeCurrency;

const sortAssetsByNativeAmount = (
  originalAssets,
  compoundAssets,
  nativeCurrency
) => {
  let assetsNativePrices = concat(originalAssets, compoundAssets);
  let total = null;
  if (!isEmpty(assetsNativePrices)) {
    const parsedAssets = parseAssetsNative(assetsNativePrices, nativeCurrency);
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
  const sortedShitcoins = sortList(noValue, 'name', 'asc');
  const allAssets = sortedAssets.concat(sortedShitcoins);

  return {
    allAssets,
    allAssetsCount: allAssets.length,
    assets: sortedAssets,
    assetsCount: sortedAssets.length,
    assetsTotal: total,
    isBalancesSectionEmpty: isEmpty(allAssets),
    shitcoins: sortedShitcoins,
    shitcoinsCount: sortedShitcoins.length,
  };
};

const groupAssetsByMarketValue = assets =>
  groupBy(assets, ({ native }) => (isNil(native) ? 'noValue' : 'hasValue'));

const parseAssetsNative = (assets, nativeCurrency) => {
  let assetsNative = assets;
  assetsNative = map(assets, asset => {
    const assetNativePrice = get(asset, 'price');
    if (isNil(assetNativePrice)) {
      return asset;
    }

    const priceUnit = get(assetNativePrice, 'value', 0);
    const nativeDisplay = convertAmountAndPriceToNativeDisplay(
      get(asset, 'balance.amount', 0),
      priceUnit,
      nativeCurrency
    );
    return {
      ...asset,
      native: {
        balance: nativeDisplay,
        change: isLowerCaseMatch(get(asset, 'symbol'), nativeCurrency)
          ? '———'
          : convertAmountToPercentageDisplay(
              assetNativePrice.relative_change_24h
            ),
        price: {
          amount: priceUnit,
          display: convertAmountToNativeDisplay(priceUnit, nativeCurrency),
        },
      },
    };
  });
  const totalAmount = assetsNative.reduce(
    (total, asset) => add(total, get(asset, 'native.balance.amount', 0)),
    0
  );
  const totalDisplay = convertAmountToNativeDisplay(
    totalAmount,
    nativeCurrency
  );
  const total = { amount: totalAmount, display: totalDisplay };
  return { assetsNativePrices: assetsNative, total };
};

export const sortAssetsByNativeAmountSelector = createSelector(
  [assetsSelector, compoundAssetsSelector, nativeCurrencySelector],
  sortAssetsByNativeAmount
);
