import isNil from 'lodash/isNil';
import toUpper from 'lodash/toUpper';
import { isNativeAsset } from '@/handlers/assets';
import networkTypes from '@/helpers/networkTypes';
import * as i18n from '@/languages';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplay, convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { getTokenMetadata, isLowerCaseMatch } from '@/utils';
import { memoFn } from '@/utils/memoFn';
import { getUniqueId } from '@/utils/ethereumUtils';

// eslint-disable-next-line no-useless-escape
const sanitize = memoFn(s => s.replace(/[^a-z0-9áéíóúñü \.,_@:-]/gim, ''));

export const parseAssetName = (metadata, name) => {
  if (metadata?.name) return metadata?.name;
  return name ? sanitize(name) : i18n.t(i18n.l.assets.unkown_token);
};

export const parseAssetSymbol = (metadata, symbol) => {
  if (metadata?.symbol) return metadata?.symbol;
  return symbol ? toUpper(sanitize(symbol)) : '———';
};

/**
 * @desc parse asset
 * @param  {Object} assetData
 * @return The parsed asset.
 */
export const parseAsset = ({ asset_code: address, ...asset } = {}) => {
  const metadata = getTokenMetadata(asset.mainnet_address || address);
  const name = parseAssetName(metadata, asset.name);
  const symbol = parseAssetSymbol(metadata, asset.symbol);

  const parsedAsset = {
    ...asset,
    ...metadata,
    address,
    isNativeAsset: isNativeAsset(address, asset.network || networkTypes.mainnet),
    name,
    symbol,
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
