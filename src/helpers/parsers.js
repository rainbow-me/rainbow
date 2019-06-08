import {
  convertAmountToDisplay,
  convertAssetAmountToBigNumber,
  convertStringToNumber,
} from '@rainbow-me/rainbow-common';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return {Array}
 */
export const parseAccountAssets = (data) => {
  try {
    let assets = [...data];
    assets = assets.map(assetData => {
      const name =
        assetData.asset.name || 'Unknown Token';
      const asset = {
        address: assetData.asset.asset_code || null,
        decimals: convertStringToNumber(assetData.asset.decimals),
        name: name,
        price: assetData.asset.price,
        symbol: assetData.asset.symbol.toUpperCase() || '———',
        uniqueId: assetData.asset.asset_code || name,
      };
      const assetBalance = convertAssetAmountToBigNumber(
        assetData.quantity,
        asset.decimals,
      );
      return {
        ...asset,
        balance: {
          amount: assetBalance,
          display: convertAmountToDisplay(assetBalance, {
            symbol: asset.symbol,
            decimals: asset.decimals,
          }),
        },
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
