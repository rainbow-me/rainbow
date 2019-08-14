import {
  filter,
  get,
  map,
  pick,
  uniq,
} from 'lodash';

/**
 * @desc parse unique tokens from opensea
 * @param  {Object}
 * @return {Array}
 */
/* eslint-disable camelcase */
export const parseAccountUniqueTokens = data => {
  const erc721s = get(data, 'data.assets', []);
  return erc721s.map(({
    asset_contract,
    background_color,
    token_id,
    ...asset
  }) => ({
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
      'description',
      'external_link',
      'featured_image_url',
      'hidden',
      'image_url',
      'name',
      'nft_version',
      'schema_name',
      'short_description',
      'symbol',
      'total_supply',
      'wiki_link',
    ]),
    background: background_color ? `#${background_color}` : null,
    familyImage: asset_contract.image_url,
    id: token_id,
    isNft: true,
    isSendable: (asset_contract.nft_version === '1.0'
                 || asset_contract.nft_version === '3.0'),
    lastPrice: (
      asset.last_sale
        ? Number(asset.last_sale.total_price)
        : null
    ),
    uniqueId: `${get(asset_contract, 'address')}_${token_id}`,
  }));
};
/* eslint-disable camelcase */

export const getFamilies = (uniqueTokens) => uniq(map(uniqueTokens, (u) => get(u, 'asset_contract.address', '')));
