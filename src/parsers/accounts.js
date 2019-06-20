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
      const name = assetData.asset.name || 'Unknown Token';
      const asset = {
        address: assetData.asset.asset_code || null,
        decimals: assetData.asset.decimals,
        name,
        price: assetData.asset.price,
        symbol: assetData.asset.symbol.toUpperCase() || '———',
        uniqueId: assetData.asset.asset_code || name,
      };
      return {
        ...asset,
        balance: convertRawAmountToBalance(assetData.quantity, asset),
      };
    });

    assets = assets.filter(
      asset => !!Number(asset.balance.amount),
    );

    return assets;
  } catch (error) {
    throw error;
  }
};
