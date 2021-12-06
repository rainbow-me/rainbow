import { get, isNil, map, toUpper } from 'lodash';
import { dedupeUniqueTokens } from './uniqueTokens';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetTypes } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/assets' o... Remove this comment to see the full error message
import { isNativeAsset } from '@rainbow-me/handlers/assets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplay,
  convertRawAmountToBalance,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
} from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { getTokenMetadata, isLowerCaseMatch } from '@rainbow-me/utils';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return {Array}
 */
export const parseAccountAssets = (data: any, uniqueTokens: any) => {
  const dedupedAssets = dedupeUniqueTokens(data, uniqueTokens);
  return dedupedAssets.map((assetData: any) => {
    const asset = parseAsset(assetData.asset);
    return {
      ...asset,
      balance: convertRawAmountToBalance(assetData.quantity, asset),
    };
  });
};

// eslint-disable-next-line no-useless-escape
const sanitize = (s: any) => s.replace(/[^a-z0-9áéíóúñü \.,_@:-]/gim, '');

export const parseAssetName = (metadata: any, name: any) => {
  if (metadata?.name) return metadata?.name;
  return name ? sanitize(name) : 'Unknown Token';
};

export const parseAssetSymbol = (metadata: any, symbol: any) => {
  if (metadata?.symbol) return metadata?.symbol;
  return symbol ? toUpper(sanitize(symbol)) : '———';
};

/**
 * @desc parse asset
 * @param  {Object} assetData
 * @return {Object}
 */
export const parseAsset = ({ asset_code: address, ...asset }: any = {}) => {
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
      ? asset.network
        ? `${address}_${asset.network}`
        : address
      : name,
  };

  return parsedAsset;
};

export const parseAssetsNativeWithTotals = (
  assets: any,
  nativeCurrency: any
) => {
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

export const parseAssetsNative = (assets: any, nativeCurrency: any) =>
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
