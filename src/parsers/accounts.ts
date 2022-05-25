import { get, isNil, map, toUpper } from 'lodash';
import { ParsedAddressAssetWithNative } from '../entities/tokens';
import { dedupeUniqueTokens } from './uniqueTokens';
import {
  AssetBalanceInfo,
  AssetPricingInfo,
  AssetType,
  AssetTypes,
  NativeCurrencyKey,
  ParsedAddressAsset,
  RainbowToken,
  UniqueAsset,
  ZerionAsset,
  ZerionAssetFallback,
} from '@rainbow-me/entities';
import { isNativeAsset } from '@rainbow-me/handlers/assets';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  add,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplay,
  isOfType,
} from '@rainbow-me/utilities';
import {
  ethereumUtils,
  getTokenMetadata,
  isLowerCaseMatch,
} from '@rainbow-me/utils';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return The array of parsed account assets.
 */
export const parseAccountAssets = (
  data: Record<string, ZerionAsset>,
  uniqueTokens: UniqueAsset[]
): Record<string, ParsedAddressAsset> => {
  const dedupedAssets: Record<string, ZerionAsset> = dedupeUniqueTokens(
    data,
    uniqueTokens
  );
  return Object.keys(dedupedAssets).reduce(
    (parsedAccountAssets, currentKey) => {
      const currentAsset = dedupedAssets[currentKey];
      const parsedAsset = parseAsset(currentAsset);
      return {
        ...parsedAccountAssets,
        [currentKey]: parsedAsset,
      };
    },
    {}
  );
};

// eslint-disable-next-line no-useless-escape
const sanitize = (s: string) => s.replace(/[^a-z0-9áéíóúñü \.,_@:-]/gim, '');

export const parseAssetName = (
  metadata: RainbowToken | undefined,
  name: string
) => {
  if (metadata?.name) return metadata?.name;
  return name ? sanitize(name) : 'Unknown Token';
};

export const parseAssetSymbol = (
  metadata: RainbowToken | undefined,
  symbol: string
) => {
  if (metadata?.symbol) return metadata?.symbol;
  return symbol ? toUpper(sanitize(symbol)) : '———';
};

/**
 * @desc parse asset
 * @param  {Object} asset
 * @return The parsed asset.
 */
export const parseGenericAsset = (
  asset: ZerionAsset | ZerionAssetFallback
): ParsedAddressAsset => {
  const address = asset.asset_code;
  const metadata = getTokenMetadata(asset.mainnet_address || address);
  const name = parseAssetName(metadata, asset.name);
  const symbol = parseAssetSymbol(metadata, asset.symbol);
  const type = Object.keys(AssetTypes).includes(asset.type!)
    ? (asset.type as AssetType)
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
    uniqueId: ethereumUtils.getUniqueId({
      address,
      network: asset.network,
    }),
  };

  return parsedAsset;
};

export const parseAsset = (asset: ZerionAsset) => {
  return parseGenericAsset(asset);
};

export const parseFallbackAsset = (asset: ZerionAssetFallback) => {
  return parseGenericAsset(asset);
};

export const parseAssetsNativeWithTotals = (
  assets: ParsedAddressAsset[],
  prices: { [uniqueId: string]: AssetPricingInfo },
  balances: { [uniqueId: string]: AssetBalanceInfo },
  nativeCurrency: string
) => {
  const assetsWithPricesAndBalances: ParsedAddressAsset[] = assets
    .map(asset => {
      let updatedAsset = asset;
      const balance = balances?.[asset.uniqueId];
      const price = prices?.[asset.uniqueId];
      if (balance) {
        updatedAsset.balance = balance;
      }
      if (price) {
        updatedAsset.price =
          price[nativeCurrency.toUpperCase() as NativeCurrencyKey];
      }
      return updatedAsset;
    })
    .filter(asset =>
      asset.balance ? parseFloat(asset.balance?.amount || '0') > 0 : true
    )
    .filter(asset => (asset.price ? (asset.price.value || 0) > 0 : true));
  const assetsNative = parseAssetsNative(
    assetsWithPricesAndBalances,
    nativeCurrency
  );
  const totalAmount = assetsNative.reduce((total, currentAsset) => {
    if (isOfType<ParsedAddressAssetWithNative>(currentAsset, 'native')) {
      return parseFloat(add(total, currentAsset?.native?.balance.amount));
    } else {
      return total;
    }
  }, 0);
  const totalDisplay = convertAmountToNativeDisplay(
    totalAmount,
    nativeCurrency
  );
  const total = { amount: totalAmount, display: totalDisplay };
  return { assetsNativePrices: assetsNative, total };
};

export const parseAssetsNative = (
  assets: ParsedAddressAsset[],
  nativeCurrency: string
) => map(assets, asset => parseAssetNative(asset, nativeCurrency));

export const parseAssetNative = (
  asset: ParsedAddressAsset,
  nativeCurrency: string
): ParsedAddressAsset | ParsedAddressAssetWithNative => {
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
      change: isLowerCaseMatch(asset?.symbol!, nativeCurrency)
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
