import { get, isNil, map, toUpper } from 'lodash';
import { dedupeUniqueTokens } from './uniqueTokens';
import {
  AssetType,
  AssetTypes,
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
  convertRawAmountToBalance,
} from '@rainbow-me/utilities';
import { getTokenMetadata, isLowerCaseMatch } from '@rainbow-me/utils';
import { ParsedAddressAssetWithNative } from 'src/entities/tokens';

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return The array of parsed account assets.
 */
export const parseAccountAssets = (
  data: Record<string, ZerionAsset>,
  uniqueTokens: UniqueAsset[]
): Record<string, ParsedAddressAsset> => {
  const dedupedAssets: Record<string, ZerionAsset> = dedupeUniqueTokens(data, uniqueTokens);
  const dedupedKeys = Object.keys(dedupedAssets);

  return dedupedKeys.reduce((parsedAccountAssets, currentKey) => {
      const currentAsset = dedupedAssets[currentKey];
      const parsedAsset = parseAsset(currentAsset);
      return ({
          ...parsedAccountAssets,
          [currentKey]: {
              ...parsedAsset,
              balance: convertRawAmountToBalance(currentAsset.quantity!, currentAsset),
          },
      });
  }, {});
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
 * @param  {Object} assetData
 * @return The parsed asset.
 */
export const parseAsset = (asset: ZerionAsset | ZerionAssetFallback) => {
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
    uniqueId: address
      ? asset.network && asset.network !== networkTypes.mainnet
        ? `${address}_${asset.network}`
        : address
      : name,
  };

  return parsedAsset;
};

export const isOfType = <T>(
    varToBeChecked: any,
    propertyToCheckFor: keyof T
  ): varToBeChecked is T =>
    (varToBeChecked as T)[propertyToCheckFor] !== undefined;

export const parseAssetsNativeWithTotals = (assets: ParsedAddressAsset[], nativeCurrency: string) => {
  const assetsNative = parseAssetsNative(assets, nativeCurrency);
  const totalAmount = assetsNative.reduce(
    (total, currentAsset) => {
        if (isOfType<ParsedAddressAssetWithNative>(currentAsset, 'native')) {
            return parseFloat(add(total, currentAsset?.native?.balance.amount));
        } else {
            return total;
        }
    },
    0
  );
  const totalDisplay = convertAmountToNativeDisplay(
    totalAmount,
    nativeCurrency
  );
  const total = { amount: totalAmount, display: totalDisplay };
  return { assetsNativePrices: assetsNative, total };
};

export const parseAssetsNative = (assets: ParsedAddressAsset[], nativeCurrency: string) =>
  map(assets, asset => parseAssetNative(asset, nativeCurrency));

export const parseAssetNative = (asset: ParsedAddressAsset, nativeCurrency: string): ParsedAddressAsset | ParsedAddressAssetWithNative => {
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
