import { isNil } from 'lodash';
import { CardSize } from '../components/unique-token/CardSize';
import { OpenseaPaymentTokens } from '@/references/opensea';
import { AssetTypes } from '@/entities';
import { maybeSignUri, imageToPng } from '@/handlers/imgix';
import svgToPngIfNeeded from '@/handlers/svgs';
import { Network } from '@/helpers/networkTypes';
import { pickShallow } from '@/helpers/utilities';
import { ENS_NFT_CONTRACT_ADDRESS, POAP_NFT_ADDRESS } from '@/references';
import { getFullSizePngUrl } from '@/utils/getFullSizePngUrl';
import { getLowResUrl } from '@/utils/getLowResUrl';
import isSVGImage from '@/utils/isSVG';

const parseLastSalePrice = lastSale =>
  lastSale
    ? Math.round(
        (lastSale?.total_price / 1000000000000000000 + Number.EPSILON) * 1000
      ) / 1000
    : null;

const getCurrentPrice = ({ currentPrice, token }) => {
  if (!token || !currentPrice) {
    return null;
  }

  const paymentToken = OpenseaPaymentTokens.find(
    osToken => osToken.address.toLowerCase() === token.toLowerCase()
  );

  if (!currentPrice || !paymentToken) return null;
  // Use the decimals returned from the token list to calculate a human readable value. Add 1 to decimals as padEnd includes the first digit
  const price =
    Number(currentPrice) / Number('1'.padEnd(paymentToken.decimals + 1, '0'));

  return `${price} ${paymentToken.symbol}`;
};

export const getOpenSeaCollectionUrl = slug =>
  `https://opensea.io/collection/${slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`;

/**
 * @desc signs and handles low res + full res images
 * @param  {Object}
 * @return {Object}
 */

export const handleAndSignImages = (originalImageUrl, nonSVGUrl, isSVG) => {
  if (!originalImageUrl) {
    return { originalImageUrl: null, lowResPngUrl: null, fullResPngUrl: null };
  }

  const safeNonSvgUrl = nonSVGUrl ?? svgToPngIfNeeded(originalImageUrl);
  const fullResPngUrl = getFullSizePngUrl(safeNonSvgUrl);
  const fullImage = isSVG ? originalImageUrl : fullResPngUrl;

  return {
    fullResUrl: fullImage,
    lowResPngUrl: imageToPng(safeNonSvgUrl, CardSize),
    fullResPngUrl,
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

        const sellOrder = asset.seaport_sell_orders?.[0];

        return {
          ...pickShallow(asset, [
            'animation_url',
            'description',
            'external_link',
            'last_sale',
            'name',
            'permalink',
            'traits',
            'seaport_sell_orders',
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
          currentPrice: sellOrder
            ? getCurrentPrice({
                currentPrice: sellOrder?.current_price,
                token:
                  sellOrder?.protocol_data?.parameters?.consideration?.[0]
                    ?.token,
              })
            : null,
          familyImage: collection.image_url,
          familyName:
            asset_contract.address === ENS_NFT_CONTRACT_ADDRESS
              ? 'ENS'
              : collection.name,
          /*
           * TODO replace with `chain_identifier` from OpenSea API v2 response
           * once we migrate off v1. `ethereum` here is hard-coded to match the
           * v2 response we utilize on web profiles, as opposed to
           * `Network.mainnet` that we typically use in the app.
           */
          fullUniqueId: `ethereum_${asset_contract?.address}_${token_id}`,
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
          marketplaceCollectionUrl: getOpenSeaCollectionUrl(collection.slug),
          marketplaceId: 'opensea',
          marketplaceName: 'OpenSea',
          network: Network.mainnet,
          type: AssetTypes.nft,
          uniqueId:
            asset_contract.address === ENS_NFT_CONTRACT_ADDRESS
              ? asset.name
              : `${asset_contract?.address}_${token_id}`,
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

      const sellOrder = asset.seaport_sell_orders?.[0];
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
        currentPrice: sellOrder
          ? getCurrentPrice({
              currentPrice: sellOrder?.current_price,
              token:
                sellOrder?.protocol_data?.parameters?.consideration?.[0]?.token,
            })
          : null,
        familyImage: collection.image_url,
        familyName:
          asset_contract.address === ENS_NFT_CONTRACT_ADDRESS
            ? 'ENS'
            : collection.name,
        fullUniqueId: `${Network.polygon}_${asset_contract?.address}_${token_id}`,
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
        marketplaceCollectionUrl: getOpenSeaCollectionUrl(collection.slug),
        marketplaceId: 'opensea',
        marketplaceName: 'OpenSea',
        network: Network.polygon,
        permalink: asset.permalink,
        type: AssetTypes.nft,
        uniqueId: `${Network.polygon}_${asset_contract?.address}_${token_id}`,
      };
    })
    .filter(token => !!token.familyName && token.familyName !== 'POAP');

  return erc721s;
};

const getSimplehashMarketplaceInfo = simplehashNft => {
  const marketplace = simplehashNft.collection.marketplace_pages?.[0];
  if (!marketplace) return null;

  const marketplaceId = marketplace.marketplace_id;
  const marketplaceName = marketplace.marketplace_name;
  const collectionId = marketplace.marketplace_collection_id;
  const collectionUrl = marketplace.collection_url;
  const permalink = marketplace.nft_url;

  return {
    collectionId,
    collectionUrl,
    marketplaceId,
    marketplaceName,
    permalink,
  };
};

export const getNetworkFromSimplehashChain = chain =>
  chain === 'ethereum' || chain === 'gnosis' ? Network.mainnet : chain;

export const getSimplehashChainFromNetwork = network =>
  network === Network.mainnet ? 'ethereum' : network;

const getRoundedValueFromRawAmount = (rawAmount, decimals) => {
  if (rawAmount && decimals) {
    return Math.round(rawAmount * 10 ** -decimals * 1000) / 1000;
  }
  return null;
};

export const parseSimplehashNfts = nftData => {
  const results = nftData?.map(simplehashNft => {
    const collection = simplehashNft.collection;
    // slices off simplehash's sizing suffix s=1000
    const fullSizeNonSVGUrl = simplehashNft.previews.image_large_url?.slice(
      0,
      -6
    );

    const { fullResUrl, lowResPngUrl, fullResPngUrl } = handleAndSignImages(
      simplehashNft.image_url ??
        simplehashNft.extra_metadata?.image_original_url,
      fullSizeNonSVGUrl,
      simplehashNft?.image_properties?.mime_type
    );

    const openSeaFloorPriceEth = collection?.floor_prices?.find(
      floorPrice =>
        floorPrice?.marketplace_id === 'opensea' &&
        floorPrice?.payment_token?.payment_token_id === 'ethereum.native'
    );

    const marketplaceInfo = getSimplehashMarketplaceInfo(simplehashNft);

    const openSea = simplehashNft.collection.marketplace_pages.find(
      marketplace => marketplace.marketplace_id === 'opensea'
    );

    const network = getNetworkFromSimplehashChain(simplehashNft.chain);

    const isPoap =
      simplehashNft.contract_address.toLowerCase() === POAP_NFT_ADDRESS;
    const isEns =
      simplehashNft.contract_address.toLowerCase() === ENS_NFT_CONTRACT_ADDRESS;

    if (simplehashNft.contract.type === 'ERC721') {
      console.log(simplehashNft.collection.name);
    }
    console.log(simplehashNft);
    const parsedNft = {
      videos: {
        url: simplehashNft.video_url,
        mimeType: simplehashNft.video_properties?.mime_type,
      },
      asset_contract: {
        address: simplehashNft.contract_address,
        name: simplehashNft.contract.name,
        schema_name: simplehashNft.contract.type,
        symbol: simplehashNft.contract.symbol,
      },
      images: {
        fullResUrl,
        fullResPngUrl,
        lowResPngUrl,
        mimeType: simplehashNft.image_properties?.mime_type,
        blurhash: simplehashNft.previews?.blurhash,
      },
      backgroundColor: simplehashNft.background_color,
      predominantColor: simplehashNft.previews?.predominant_color,
      description: simplehashNft.description,
      externalUrl: simplehashNft.external_url,
      uniqueId: `${network}_${simplehashNft.contract_address}_${simplehashNft.token_id}`,
      tokenId: simplehashNft.token_id,
      isPoap,
      isEns,
      isSendable:
        !isPoap &&
        (simplehashNft.contract.type === 'ERC721' ||
          simplehashNft.contract.type === 'ERC1155'),
      lastSale: simplehashNft.last_sale,
      name: simplehashNft.name,
      network,
      traits:
        simplehashNft.extra_metadata?.attributes?.map(trait => ({
          displayType: trait?.display_type,
          traitType: trait.trait_type,
          value: trait.value,
        })) ?? [],
      type: AssetTypes.nft,
      simplehashSpamScore: collection?.spam_score,
      collection: {
        imageUrl: maybeSignUri(collection.image_url),
        name: isEns ? 'ENS' : collection.name,
        description: collection.description,
        externalUrl: collection.external_url,
        twitter: collection.twitter_username,
        discord: collection.discord_url,
      },
      marketplaces: {
        opensea: {
          id: openSea?.marketplace_id ?? null,
          name: openSea?.marketplace_name ?? null,
          nftUrl: openSea?.nft_url ?? null,
          collectionUrl: openSea?.collection_url ?? null,
          collectionId: openSea?.marketplace_collection_id ?? null,
          // we only use eth floor prices right now
          floorPrice: getRoundedValueFromRawAmount(
            openSeaFloorPriceEth?.value,
            openSeaFloorPriceEth?.payment_token?.decimals
          ),
        },
      },
    };
    return parsedNft;
  });
  return results;
};
