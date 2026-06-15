import isNil from 'lodash/isNil';

import type { ParsedAddressAsset } from '@/entities/tokens';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { convertAmountToPercentageDisplay } from '@/helpers/utilities';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

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
        ? undefined
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
