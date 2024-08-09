import isNil from 'lodash/isNil';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplay, convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { isLowerCaseMatch } from '@/utils';
import { NativeCurrencyKey, ParsedAddressAsset } from '@/entities';

export const parseAssetsNative = (assets: ParsedAddressAsset[], nativeCurrency: NativeCurrencyKey) =>
  assets.map(asset => parseAssetNative(asset, nativeCurrency));

export const parseAssetNative = (asset: ParsedAddressAsset, nativeCurrency: NativeCurrencyKey) => {
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
        amount: priceUnit?.toString(),
        display: convertAmountToNativeDisplay(priceUnit, nativeCurrency),
      },
    },
  };
};
