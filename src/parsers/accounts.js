import { toUpper } from 'lodash';
import { dedupeUniqueTokens } from './uniqueTokens';
import AssetTypes from '@rainbow-me/helpers/assetTypes';
import { convertRawAmountToBalance } from '@rainbow-me/helpers/utilities';
import { getTokenMetadata } from '@rainbow-me/utils';

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
 * @return {Object}
 */
export const parseAsset = ({ asset_code: address, ...asset } = {}) => {
  const metadata = getTokenMetadata(address);
  const name = parseAssetName(metadata, asset.name);
  const symbol = parseAssetSymbol(metadata, asset.symbol);

  return {
    ...asset,
    ...metadata,
    address,
    name,
    symbol,
    type: AssetTypes.token,
    uniqueId: address || name,
  };
};
