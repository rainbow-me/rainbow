import { get, groupBy, isNull } from 'lodash';

const EMPTY_ARRAY = [];

export const buildUniqueTokenList = (uniqueTokensAssets) => {
  const list = [];

  for (let i = 0; i < uniqueTokensAssets.length; i += 2) {
    list.push([uniqueTokensAssets[i], uniqueTokensAssets[i + 1]]);
  }

  return list;
};

export const groupAssetsByMarketValue = assets => groupBy(assets, ({ native }) => (
  isNull(native) ? 'noValue' : 'hasValue'
));

export const sortAssetsByNativeAmount = (assets, showShitcoins) => {
  const assetsByMarketValue = groupAssetsByMarketValue(assets);

  const sortedAssetsWithMarketValue = (assetsByMarketValue.hasValue || EMPTY_ARRAY).sort((a, b) => {
    const amountA = get(a, 'native.balance.amount', 0);
    const amountB = get(b, 'native.balance.amount', 0);
    return parseFloat(amountB) - parseFloat(amountA);
  });

  if (showShitcoins) {
    const sortedAssetsWithNoMarketValue = (assetsByMarketValue.noValue || EMPTY_ARRAY).sort((a, b) => (
      (a.name < b.name) ? -1 : 1
    ));

    return sortedAssetsWithMarketValue.concat(sortedAssetsWithNoMarketValue);
  }

  return sortedAssetsWithMarketValue;
};
