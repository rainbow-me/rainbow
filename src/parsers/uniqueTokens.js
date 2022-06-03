import {
  get,
  isEmpty,
  isNil,
  map,
  pick,
  pickBy,
  remove,
  toLower,
  uniq,
} from 'lodash';
import { CardSize } from '../components/unique-token/CardSize';
import { AssetTypes } from '@rainbow-me/entities';
import { fetchMetadata, isUnknownOpenSeaENS } from '@rainbow-me/handlers/ens';
import { maybeSignUri } from '@rainbow-me/handlers/imgix';
import svgToPngIfNeeded from '@rainbow-me/handlers/svgs';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  ENS_NFT_CONTRACT_ADDRESS,
  polygonAllowList,
} from '@rainbow-me/references';
import { getFullSizeUrl } from '@rainbow-me/utils/getFullSizeUrl';
import { getLowResUrl } from '@rainbow-me/utils/getLowResUrl';
import isSVGImage from '@rainbow-me/utils/isSVG';

const parseLastSalePrice = lastSale =>
  lastSale
    ? Math.round(
        (lastSale?.total_price / 1000000000000000000 + Number.EPSILON) * 1000
      ) / 1000
    : null;

/**
 * @desc signs and handles low res + full res images
 * @param  {Object}
 * @return {Object}
 */

export const handleAndSignImages = (imageUrl, previewUrl, originalUrl) => {
  if (!imageUrl && !previewUrl && !originalUrl) {
    return { imageUrl: undefined, lowResUrl: undefined };
  }

  const lowResImageOptions = {
    w: CardSize,
  };
  const isSVG = isSVGImage(imageUrl);
  const image = imageUrl || originalUrl || previewUrl;
  const fullImage = isSVG ? image : getFullSizeUrl(image);

  const lowResUrl = isSVG
    ? maybeSignUri(svgToPngIfNeeded(image), lowResImageOptions)
    : getLowResUrl(image);

  return {
    imageUrl: fullImage,
    lowResUrl,
  };
};

/**
 * @desc parse unique tokens from opensea
 * @param  {Object}
 * @return {Array}
 */

export const parseAccountUniqueTokens = data => {
  const erc721s = get(data, 'data.assets', null);
  if (isNil(erc721s)) throw new Error('Invalid data from OpenSea');
  return erc721s
    .map(
      ({
        asset_contract,
        background_color,
        collection,
        token_id,
        ...asset
      }) => {
        const { imageUrl, lowResUrl } = handleAndSignImages(
          asset.image_url,
          asset.image_original_url,
          asset.image_preview_url
        );
        return {
          ...pick(asset, [
            'animation_url',
            'current_price',
            'description',
            'external_link',
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
          image_original_url: asset.image_url,
          image_url: imageUrl,
          isSendable:
            asset_contract.nft_version === '1.0' ||
            asset_contract.nft_version === '3.0' ||
            asset_contract.schema_name === 'ERC721' ||
            asset_contract.schema_name === 'ERC1155',
          lastPrice: parseLastSalePrice(asset.last_sale),
          lastPriceUsd: asset.last_sale
            ? asset.last_sale?.payment_token?.usd_price
            : null,
          lastSale: asset.last_sale,
          lastSalePaymentToken: asset.last_sale
            ? asset.last_sale.payment_token?.symbol
            : null,
          lowResUrl,
          type: AssetTypes.nft,
          uniqueId:
            asset_contract.address === ENS_NFT_CONTRACT_ADDRESS
              ? asset.name
              : `${get(asset_contract, 'address')}_${token_id}`,
          urlSuffixForAsset: `${get(asset_contract, 'address')}/${token_id}`,
        };
      }
    )
    .filter(token => !!token.familyName);
};

export const parseAccountUniqueTokensPolygon = data => {
  let erc721s = data?.data?.results;
  if (isNil(erc721s)) throw new Error('Invalid data from OpenSea Polygon');
  erc721s = erc721s
    .map(({ asset_contract, collection, token_id, metadata, ...asset }) => {
      const { imageUrl, lowResUrl } = handleAndSignImages(
        asset.image_url,
        asset.image_original_url,
        asset.image_preview_url
      );
      return {
        ...pick(metadata, [
          'animation_url',
          'description',
          'external_link',
          'name',
          'traits',
        ]),
        asset_contract: pick(asset_contract, [
          'address',
          'name',
          'contract_standard',
        ]),
        background: metadata.background_color
          ? `#${metadata.background_color}`
          : null,
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
        image_original_url: asset.image_url,
        image_url: imageUrl,
        isSendable: false,
        lastPrice: parseLastSalePrice(asset.last_sale),
        lastPriceUsd: asset.last_sale
          ? asset.last_sale?.payment_token?.usd_price
          : null,
        lastSale: asset.last_sale,
        lastSalePaymentToken: asset.last_sale
          ? asset.last_sale.payment_token?.symbol
          : null,
        lowResUrl,
        network: Network.polygon,
        permalink: asset.permalink,
        type: AssetTypes.nft,
        uniqueId: `${Network.polygon}_${get(
          asset_contract,
          'address'
        )}_${token_id}`,
        urlSuffixForAsset: `${get(asset_contract, 'address')}/${token_id}`,
      };
    })
    .filter(token => !!token.familyName && token.familyName !== 'POAP');

  //filter out NFTs that are not on our allow list
  remove(
    erc721s,
    NFT => !polygonAllowList.includes(toLower(NFT.asset_contract.address))
  );

  return erc721s;
};

export const applyENSMetadataFallbackToToken = async token => {
  const isENS =
    token?.asset_contract?.address?.toLowerCase() ===
    ENS_NFT_CONTRACT_ADDRESS.toLowerCase();
  if (isENS && isUnknownOpenSeaENS(token)) {
    const { name, image_url } = await fetchMetadata({
      tokenId: token.id,
    });
    const { imageUrl, lowResUrl } = handleAndSignImages(image_url);
    return {
      ...token,
      image_preview_url: lowResUrl,
      image_url: imageUrl,
      lowResUrl,
      name,
      uniqueId: name,
    };
  }
  return token;
};

export const applyENSMetadataFallbackToTokens = async data => {
  return await Promise.all(
    data.map(async token => {
      try {
        return applyENSMetadataFallbackToToken(token);
      } catch {
        return token;
      }
    })
  );
};

export const getFamilies = uniqueTokens =>
  uniq(map(uniqueTokens, u => get(u, 'asset_contract.address', '')));

export const dedupeUniqueTokens = (newAssets, uniqueTokens) => {
  const uniqueTokenFamilies = getFamilies(uniqueTokens);
  let updatedAssets = newAssets;
  if (!isEmpty(newAssets)) {
    updatedAssets = pickBy(updatedAssets, newAsset => {
      const matchingElement = uniqueTokenFamilies?.find(
        uniqueTokenFamily => uniqueTokenFamily === newAsset?.asset?.asset_code
      );
      return !matchingElement;
    });
  }
  return updatedAssets;
};

export const dedupeAssetsWithFamilies = (accountAssets, families) =>
  pickBy(
    accountAssets,
    asset => !families?.find(family => family === asset?.address)
  );
