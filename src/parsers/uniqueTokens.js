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
        'last_sale',
        'name',
        'permalink',
        'sell_orders',
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
        'discord_url',
        'external_url',
        'featured_image_url',
        'hidden',
        'image_url',
        'name',
        'short_description',
        'slug',
        'twitter_username',
        'wiki_link',
      ]),
      currentPrice: asset.sell_orders
        ? `${
            Number(asset.sell_orders[0].current_price) / 1000000000000000000
          } ${asset.sell_orders[0].payment_token_contract.symbol}`
        : null,
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
      lastPrice: asset.last_sale
        ? Number(asset.last_sale?.total_price / 1000000000000000000) +
          ` ${asset.last_sale.payment_token?.symbol}`
        : null,
      lastPriceUsd: asset.last_sale
        ? asset.last_sale?.payment_token?.usd_price
        : null,
      lastSale: asset.last_sale,
      type: AssetTypes.nft,
      uniqueId:
        asset_contract.address === ENS_NFT_CONTRACT_ADDRESS
          ? asset.name
          : `${get(asset_contract, 'address')}_${token_id}`,
      urlSuffixForAsset: `${get(asset_contract, 'address')}/${token_id}`,
    })
  ).filter(token => !!token.familyName);
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
