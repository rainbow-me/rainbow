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
      const name = get(assetData, 'asset.name') || 'Unknown Token';
      const symbol = get(assetData, 'asset.symbol') || '———';
      const asset = {
        address: get(assetData, 'asset.asset_code', null),
        decimals: get(assetData, 'asset.decimals'),
        name,
        price: get(assetData, 'asset.price'),
        symbol: symbol.toUpperCase(),
        uniqueId: get(assetData, 'asset.asset_code') || name,
      };
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
