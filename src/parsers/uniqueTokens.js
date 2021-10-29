import { filter, find, get, isNil, map, pick, uniq } from 'lodash';
import { AssetTypes } from '@rainbow-me/entities';
import { ENS_NFT_CONTRACT_ADDRESS } from '@rainbow-me/references';

/**
 * @desc parse unique tokens from opensea
 * @param  {Object}
 * @return {Array}
 */

export const parseAccountUniqueTokens = data => {
  const erc721s = get(data, 'data.assets', null);
  if (isNil(erc721s)) throw new Error('Invalid data from OpenSea');
  return erc721s.map(
    ({ asset_contract, background_color, collection, token_id, ...asset }) => ({
      ...pick(asset, [
        'animation_url',
        'current_price',
        'description',
        'external_link',
        'image_original_url',
        'image_preview_url',
        'image_thumbnail_url',
        'image_url',
        'name',
        'permalink',
        'traits',
      ]),
      asset_contract: pick(asset_contract, [
        'address',
        'name',
        'nft_version',
        'schema_name',
        'symbol',
        'total_supply',
      ]),
      background: background_color ? `#${background_color}` : null,
      collection: pick(collection, [
        'description',
        'external_url',
        'featured_image_url',
        'hidden',
        'image_url',
        'name',
        'short_description',
        'wiki_link',
      ]),
      familyImage: collection.image_url,
      familyName:
        asset_contract.address === ENS_NFT_CONTRACT_ADDRESS
          ? 'ENS'
          : collection.name,
      id: token_id,
      isSendable:
        asset_contract.nft_version === '1.0' ||
        asset_contract.nft_version === '3.0' ||
        asset_contract.schema_name === 'ERC1155',
      lastPrice: asset.last_sale ? Number(asset.last_sale.total_price) : null,
      type: AssetTypes.nft,
      uniqueId:
        asset_contract.address === ENS_NFT_CONTRACT_ADDRESS
          ? asset.name
          : `${get(asset_contract, 'address')}_${token_id}`,
    })
  );
};

export const getFamilies = uniqueTokens =>
  uniq(map(uniqueTokens, u => get(u, 'asset_contract.address', '')));

export const dedupeUniqueTokens = (assets, uniqueTokens) => {
  const uniqueTokenFamilies = getFamilies(uniqueTokens);
  let updatedAssets = assets;
  if (assets.length) {
    updatedAssets = filter(updatedAssets, asset => {
      const matchingElement = find(
        uniqueTokenFamilies,
        uniqueTokenFamily =>
          uniqueTokenFamily === get(asset, 'asset.asset_code')
      );
      return !matchingElement;
    });
  }
  return updatedAssets;
};

export const dedupeAssetsWithFamilies = (assets, families) =>
  filter(
    assets,
    asset => !find(families, family => family === get(asset, 'address'))
  );
