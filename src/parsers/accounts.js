import { get } from 'lodash';
import { convertRawAmountToBalance } from '../helpers/utilities';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return {Array}
 */
export const parseAccountAssets = data => {
  try {
    let assets = [...data];
    assets = assets.map(assetData => {
      const asset = parseAsset(assetData.asset);
      return {
        ...asset,
        balance: convertRawAmountToBalance(assetData.quantity, asset),
      };
    });

    assets = assets.filter(
      asset => !!Number(get(asset, 'balance.amount')),
    );

    return assets;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc parse asset
 * @param  {Object} assetData
 * @return {Object}
 */
export const parseAsset = assetData => {
  const name = get(assetData, 'name') || 'Unknown Token';
  const symbol = get(assetData, 'symbol') || '———';
  const asset = {
    address: get(assetData, 'asset_code', null),
    decimals: get(assetData, 'decimals'),
    name,
    price: get(assetData, 'price'),
    symbol: symbol.toUpperCase(),
    uniqueId: get(assetData, 'asset_code') || name,
  };
  return asset;
};
