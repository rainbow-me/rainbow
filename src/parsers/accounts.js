import { get, isNil, map, toUpper } from 'lodash';
import { dedupeUniqueTokens } from './uniqueTokens';
import AssetTypes from '@rainbow-me/helpers/assetTypes';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplay,
  convertRawAmountToBalance,
} from '@rainbow-me/helpers/utilities';
import { tokenOverrides } from '@rainbow-me/references';
import { isLowerCaseMatch } from '@rainbow-me/utils';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return {Array}
 */
export const parseAccountAssets = (data, uniqueTokens) => {
  const dedupedAssets = dedupeUniqueTokens(data, uniqueTokens);
  return dedupedAssets.map(assetData => {
    const asset = parseAsset(assetData.asset);
    return {
      ...asset,
      balance: convertRawAmountToBalance(assetData.quantity, asset),
    };
  });
};

// eslint-disable-next-line no-useless-escape
const sanitize = s => s.replace(/[^a-z0-9áéíóúñü \.,_@:-]/gim, '');

export const parseAssetName = (name, address) => {
  if (get(tokenOverrides[address], 'name')) return tokenOverrides[address].name;
  return name ? sanitize(name) : 'Unknown Token';
};

export const parseAssetSymbol = (symbol, address) => {
  if (get(tokenOverrides[address], 'symbol'))
    return tokenOverrides[address].symbol;
  return symbol ? toUpper(sanitize(symbol)) : '———';
};

/**
 * @desc parse asset
 * @param  {Object} assetData
 * @return {Object}
 */
export const parseAsset = ({ asset_code: address, ...asset } = {}) => {
  const name = parseAssetName(asset.name, address);
  const type =
    asset.type === AssetTypes.uniswap || asset.type === AssetTypes.uniswapV2
      ? asset.type
      : AssetTypes.token;
  return {
    ...asset,
    ...tokenOverrides[address],
    address,
    name,
    symbol: parseAssetSymbol(asset.symbol, address),
    type,
    uniqueId: address || name,
  };
};

export const parseAssetsNativeWithTotals = (assets, nativeCurrency) => {
  const assetsNative = parseAssetsNative(assets, nativeCurrency);
  const totalAmount = assetsNative.reduce(
    (total, asset) => add(total, get(asset, 'native.balance.amount', 0)),
    0
  );
  const totalDisplay = convertAmountToNativeDisplay(
    totalAmount,
    nativeCurrency
  );
  const total = { amount: totalAmount, display: totalDisplay };
  return { assetsNativePrices: assetsNative, total };
};

export const parseAssetsNative = (assets, nativeCurrency) =>
  map(assets, asset => {
    const assetNativePrice = get(asset, 'price');
    if (isNil(assetNativePrice)) {
      return asset;
    }

    const priceUnit = get(assetNativePrice, 'value', 0);
    const nativeDisplay = convertAmountAndPriceToNativeDisplay(
      get(asset, 'balance.amount', 0),
      priceUnit,
      nativeCurrency
    );
    return {
      ...asset,
      native: {
        balance: nativeDisplay,
        change: isLowerCaseMatch(get(asset, 'symbol'), nativeCurrency)
          ? null
          : assetNativePrice.relative_change_24h
          ? convertAmountToPercentageDisplay(
              assetNativePrice.relative_change_24h
            )
          : '',
        price: {
          amount: priceUnit,
          display: convertAmountToNativeDisplay(priceUnit, nativeCurrency),
        },
      },
    };
  });
