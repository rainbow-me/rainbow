import { get, toUpper } from 'lodash';
import { convertRawAmountToBalance } from '../helpers/utilities';
import { dedupeUniqueTokens } from './uniqueTokens';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return {Array}
 */
export const parseAccountAssets = (data, uniqueTokens, tokenOverrides) => {
  const dedupedAssets = dedupeUniqueTokens(data, uniqueTokens);
  let assets = dedupedAssets.map(assetData => {
    const asset = parseAsset(assetData.asset, tokenOverrides);
    return {
      ...asset,
      balance: convertRawAmountToBalance(assetData.quantity, asset),
    };
  });

  return assets.filter(asset => !!Number(get(asset, 'balance.amount')));
};

/**
 * @desc parse asset
 * @param  {Object} assetData
 * @return {Object}
 */
export const parseAsset = (assetData, tokenOverrides) => {
  const address = get(assetData, 'asset_code', null);
  const name = get(assetData, 'name') || 'Unknown Token';
  let symbol = get(assetData, 'symbol') || '———';
  if (symbol && symbol.includes('*')) {
    symbol = symbol.replace(/[*]/g, '');
  }
  const asset = {
    address,
    decimals: get(assetData, 'decimals'),
    name,
    price: get(assetData, 'price'),
    symbol: toUpper(symbol),
    uniqueId: address || name,
    ...tokenOverrides[address],
  };
  return asset;
};
