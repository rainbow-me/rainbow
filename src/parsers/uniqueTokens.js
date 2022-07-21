import { isEmpty, isNil, remove, uniq } from 'lodash';
import { CardSize } from '../components/unique-token/CardSize';
import { AssetTypes } from '@rainbow-me/entities';
import { fetchMetadata, isUnknownOpenSeaENS } from '@rainbow-me/handlers/ens';
import { maybeSignUri } from '@rainbow-me/handlers/imgix';
import svgToPngIfNeeded from '@rainbow-me/handlers/svgs';
import { Network } from '@rainbow-me/helpers/networkTypes';
import { pickBy, pickShallow } from '@rainbow-me/helpers/utilities';
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
  const erc721s = data?.data?.assets ?? null;
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
          ...pickShallow(asset, [
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
          asset_contract: pickShallow(asset_contract, [
            'address',
            'name',
            'nft_version',
            'schema_name',
            'symbol',
            'total_supply',
          ]),
          background: background_color ? `#${background_color}` : null,
          collection: pickShallow(collection, [
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
          image_thumbnail_url: lowResUrl,
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
          marketplaceName: 'OpenSea',
          type: AssetTypes.nft,
          uniqueId:
            asset_contract.address === ENS_NFT_CONTRACT_ADDRESS
              ? asset.name
              : `${asset_contract?.address}_${token_id}`,
          urlSuffixForAsset: `${asset_contract?.address}/${token_id}`,
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
        metadata.image_url,
        metadata.image_original_url,
        metadata.image_preview_url
      );
      return {
        ...pickShallow(metadata, [
          'animation_url',
          'description',
          'external_link',
          'name',
          'traits',
        ]),
        asset_contract: pickShallow(asset_contract, [
          'address',
          'name',
          'contract_standard',
        ]),
        background: metadata.background_color
          ? `#${metadata.background_color}`
          : null,
        collection: pickShallow(collection, [
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
        image_thumbnail_url: lowResUrl,
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
        marketplaceName: 'OpenSea',
        network: Network.polygon,
        permalink: asset.permalink,
        type: AssetTypes.nft,
        uniqueId: `${Network.polygon}_${asset_contract?.address}_${token_id}`,
        urlSuffixForAsset: `${asset_contract?.address}/${token_id}`,
      };
    })
    .filter(token => !!token.familyName && token.familyName !== 'POAP');

  //filter out NFTs that are not on our allow list
  remove(
    erc721s,
    nft =>
      !polygonAllowList.includes(nft?.asset_contract?.address?.toLowerCase())
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
      image_thumbnail_url: lowResUrl,
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
        return await applyENSMetadataFallbackToToken(token);
      } catch {
        return token;
      }
    })
  );
};

export const getFamilies = uniqueTokens =>
  uniq(uniqueTokens.map(u => u?.asset_contract?.address ?? ''));

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

const getSimplehashMarketplaceInfo = simplehashNft => {
  const marketplace = simplehashNft.collection.marketplace_pages?.[0];
  if (!marketplace) return null;

  const marketplaceName = marketplace.marketplace_name;
  const collectionId = marketplace.marketplace_collection_id;
  const tokenId = simplehashNft.token_id;
  let permalink = null;
  switch (marketplaceName) {
    case 'Quixotic':
      permalink = `https://quixotic.io/asset/${collectionId}/${tokenId}`;
      break;
    case 'Stratos':
      permalink = `https://stratosnft.io/asset/${collectionId}/${tokenId}`;
      break;
    default:
      permalink = null;
  }
  return {
    collectionId,
    marketplaceName,
    permalink,
  };
};

export const parseSimplehashNfts = nftData => {
  const results = nftData?.map(simplehashNft => {
    const collection = simplehashNft.collection;

    const { imageUrl, lowResUrl } = handleAndSignImages(
      simplehashNft.image_url,
      simplehashNft.extra_metadata?.image_original_url,
      simplehashNft.previews.image_small_url
    );

    const marketplaceInfo = getSimplehashMarketplaceInfo(simplehashNft);

    const parsedNft = {
      animation_url: simplehashNft.extra_metadata?.animation_original_url,
      asset_contract: {
        address: simplehashNft.contract_address,
        name: simplehashNft.contract.name,
        schema_name: simplehashNft.contract.type,
        symbol: simplehashNft.contract.symbol,
      },
      background: simplehashNft.background_color,
      collection: {
        description: collection.description,
        discord_url: collection.discord_url,
        external_url: collection.external_url,
        image_url: collection.image_url,
        name: collection.name,
        slug: marketplaceInfo?.collectionId,
        twitter_username: collection.twitter_username,
      },
      description: simplehashNft.description,
      external_link: simplehashNft.external_url,
      familyImage: collection.image_url,
      familyName: collection.name,
      id: simplehashNft.token_id,
      image_original_url: simplehashNft.extra_metadata?.image_original_url,
      image_preview_url: lowResUrl,
      image_thumbnail_url: lowResUrl,
      image_url: imageUrl,
      isPoap: false,
      isSendable: false,
      lastPrice: parseLastSalePrice(simplehashNft.last_sale?.unit_price),
      lastSalePaymentToken: simplehashNft.last_sale?.payment_token?.symbol,
      lowResUrl,
      marketplaceName: marketplaceInfo?.marketplaceName,
      name: simplehashNft.name,
      network: simplehashNft.chain,
      permalink: marketplaceInfo?.permalink,
      traits: simplehashNft.extra_metadata?.attributes ?? [],
      type: AssetTypes.nft,
      uniqueId: `${simplehashNft.contract_address}_${simplehashNft.token_id}`,
      urlSuffixForAsset: `${simplehashNft.contract_address}/${simplehashNft.token_id}`,
    };
    return parsedNft;
  });
  return results;
};
