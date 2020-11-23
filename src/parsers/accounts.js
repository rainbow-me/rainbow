import { get, toUpper } from 'lodash';
import AssetTypes from '../helpers/assetTypes';
import { convertRawAmountToBalance } from '../helpers/utilities';
import { tokenOverrides } from '../references';
import { dedupeUniqueTokens } from './uniqueTokens';

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
  return {
    ...asset,
    ...tokenOverrides[address],
    address,
    name,
    symbol: parseAssetSymbol(asset.symbol, address),
    type: AssetTypes.token,
    uniqueId: address || name,
  };
};
