import isNil from 'lodash/isNil';
import { isNativeAsset } from '@/handlers/assets';
import networkTypes from '@/helpers/networkTypes';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplay, convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { isLowerCaseMatch } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';

/**
 * @desc parse asset
 * @param  {Object} assetData
 * @return The parsed asset.
 */
export const parseAsset = ({ asset_code: address, ...asset } = {}) => {
  const parsedAsset = {
    ...asset,
    address,
    isNativeAsset: isNativeAsset(address, asset.network || networkTypes.mainnet),
    name,
    uniqueId: getUniqueId(address, asset.network),
  };

  return parsedAsset;
};

export const parseAssetsNative = (assets, nativeCurrency) => assets.map(asset => parseAssetNative(asset, nativeCurrency));

export const parseAssetNative = (asset, nativeCurrency) => {
  const assetNativePrice = asset?.price;
  if (isNil(assetNativePrice)) {
    return asset;
  }

  const priceUnit = assetNativePrice?.value ?? 0;
  const nativeDisplay = convertAmountAndPriceToNativeDisplay(asset?.balance?.amount ?? 0, priceUnit, nativeCurrency);
  return {
    ...asset,
    native: {
      balance: nativeDisplay,
      change: isLowerCaseMatch(asset.symbol, nativeCurrency)
        ? null
        : assetNativePrice.relative_change_24h
          ? convertAmountToPercentageDisplay(assetNativePrice.relative_change_24h)
          : '',
      price: {
        amount: priceUnit,
        display: convertAmountToNativeDisplay(priceUnit, nativeCurrency),
      },
    },
  };
};
