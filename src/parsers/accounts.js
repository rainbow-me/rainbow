import { get, isNil, map, mapValues, toUpper } from 'lodash';
import { dedupeUniqueTokens } from './uniqueTokens';
import { AssetTypes } from '@rainbow-me/entities';
import { isNativeAsset } from '@rainbow-me/handlers/assets';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplay,
  convertRawAmountToBalance,
} from '@rainbow-me/utilities';
import { getTokenMetadata, isLowerCaseMatch } from '@rainbow-me/utils';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return The array of parsed account assets.
 */
export const parseAccountAssets = (data, uniqueTokens) => {
  const dedupedAssets = dedupeUniqueTokens(data, uniqueTokens);
  return mapValues(dedupedAssets, assetData => {
    const asset = parseAsset(assetData.asset);
    return {
      ...asset,
      balance: convertRawAmountToBalance(assetData.quantity, asset),
    };
  });
};

// eslint-disable-next-line no-useless-escape
const sanitize = s => s.replace(/[^a-z0-9áéíóúñü \.,_@:-]/gim, '');

export const parseAssetName = (metadata, name) => {
  if (metadata?.name) return metadata?.name;
  return name ? sanitize(name) : 'Unknown Token';
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
  const type =
    asset.type === AssetTypes.uniswap ||
    asset.type === AssetTypes.uniswapV2 ||
    asset.type === AssetTypes.arbitrum ||
    asset.type === AssetTypes.optimism ||
    asset.type === AssetTypes.polygon
      ? asset.type
      : AssetTypes.token;

  const parsedAsset = {
    ...asset,
    ...metadata,
    address,
    isNativeAsset: isNativeAsset(
      address,
      asset.network || networkTypes.mainnet
    ),
    name,
    symbol,
    type,
    uniqueId: address
      ? asset.network && asset.network !== networkTypes.mainnet
        ? `${address}_${asset.network}`
        : address
      : name,
  };

  return parsedAsset;
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
  map(assets, asset => parseAssetNative(asset, nativeCurrency));

export const parseAssetNative = (asset, nativeCurrency) => {
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
        ? convertAmountToPercentageDisplay(assetNativePrice.relative_change_24h)
        : '',
      price: {
        amount: priceUnit,
        display: convertAmountToNativeDisplay(priceUnit, nativeCurrency),
      },
    },
  };
};
