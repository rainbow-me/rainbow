import { AssetType, AssetTypes } from '@/entities';
import { UniqueAsset } from '@/entities/uniqueAssets';
import {
  SimpleHashNFT,
  SimpleHashChain,
  SimpleHashFloorPrice,
  SimpleHashMarketplaceId,
} from '@/resources/nfts/simplehash/types';
import { Network } from '@/helpers/networkTypes';
import { handleAndSignImages } from '@/utils/handleAndSignImages';
import { ENS_NFT_CONTRACT_ADDRESS, POAP_NFT_ADDRESS } from '@/references';
import { convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import { PolygonAllowlist } from '../types';

/**
 * Returns a `SimpleHashChain` from a given `Network`. Can return undefined if
 * a `Network` has no counterpart in SimpleHash.
 */
export function getSimpleHashChainFromNetwork(
  network: Omit<Network, Network.goerli>
): SimpleHashChain | undefined {
  switch (network) {
    case Network.mainnet:
      return SimpleHashChain.Ethereum;
    case Network.polygon:
      return SimpleHashChain.Polygon;
    case Network.arbitrum:
      return SimpleHashChain.Arbitrum;
    case Network.optimism:
      return SimpleHashChain.Optimism;
    case Network.bsc:
      return SimpleHashChain.Bsc;
    default:
      return undefined;
  }
}

/**
 * Returns a `Network` from a `SimpleHashChain`. If an invalid value is
 * forcably passed in, it will throw.
 */
export function getNetworkFromSimpleHashChain(chain: SimpleHashChain): Network {
  switch (chain) {
    case SimpleHashChain.Ethereum:
    case SimpleHashChain.Gnosis:
      return Network.mainnet;
    case SimpleHashChain.Polygon:
      return Network.polygon;
    case SimpleHashChain.Arbitrum:
      return Network.arbitrum;
    case SimpleHashChain.Optimism:
      return Network.optimism;
    case SimpleHashChain.Bsc:
      return Network.bsc;
    default:
      /*
       * Throws here because according to TS types, we should NEVER hit this
       * default branch in the logic
       */
      throw new Error(
        `getNetworkFromSimpleHashChain received unknown chain: ${chain}`
      );
  }
}

/**
 * This function filters out NFTs that do not have a name, collection name,
 * contract address, or token id. It also filters out Polygon NFTs that are
 * not whitelisted by our allowlist, as well as Gnosis NFTs that are not POAPs.
 *
 * @param nfts array of SimpleHashNFTs
 * @param polygonAllowlist array of whitelisted Polygon nft contract addresses
 * @returns array of filtered NFTs
 */
export function filterSimpleHashNFTs(
  nfts: SimpleHashNFT[],
  polygonAllowlist?: PolygonAllowlist
): SimpleHashNFT[] {
  return nfts.filter(nft => {
    const lowercasedContractAddress = nft.contract_address?.toLowerCase();
    if (
      !nft.name ||
      !nft.collection?.name ||
      !nft.contract_address ||
      !nft.token_id
    ) {
      return false;
    }
    if (polygonAllowlist && nft.chain === SimpleHashChain.Polygon) {
      return !!polygonAllowlist[lowercasedContractAddress];
    }
    if (nft.chain === SimpleHashChain.Gnosis) {
      return lowercasedContractAddress === POAP_NFT_ADDRESS;
    }
    return true;
  });
}

export function simpleHashNFTToUniqueAsset(nft: SimpleHashNFT): UniqueAsset {
  const collection = nft.collection;

  const { imageUrl, lowResUrl } = handleAndSignImages(
    // @ts-ignore
    nft.image_url,
    nft.previews.image_large_url,
    nft.extra_metadata?.image_original_url
  );

  const marketplace = nft.collection.marketplace_pages?.[0];

  const floorPrice = collection?.floor_prices?.find(
    (floorPrice: SimpleHashFloorPrice) =>
      floorPrice?.marketplace_id === SimpleHashMarketplaceId.OpenSea &&
      floorPrice?.payment_token?.payment_token_id === 'ethereum.native'
  );

  const isENS = nft.contract_address.toLowerCase() === ENS_NFT_CONTRACT_ADDRESS;

  return {
    animation_url: nft?.video_url,
    asset_contract: {
      address: nft.contract_address,
      name: nft.contract.name || undefined,
      schema_name: nft.contract.type,
      symbol: nft.contract.symbol || undefined,
    },
    background: nft.background_color,
    collection: {
      description: collection.description,
      discord_url: collection.discord_url,
      external_url: collection.external_url,
      image_url: collection.image_url,
      name: isENS ? 'ENS' : collection.name ?? '',
      slug: marketplace?.marketplace_collection_id ?? '',
      twitter_username: collection.twitter_username,
    },
    description: nft.description,
    external_link: nft.external_url,
    familyImage: collection.image_url,
    familyName: isENS ? 'ENS' : collection.name,
    floorPriceEth:
      floorPrice?.value !== null && floorPrice?.value !== undefined
        ? convertRawAmountToRoundedDecimal(
            floorPrice?.value,
            floorPrice?.payment_token?.decimals,
            // TODO: switch to 3 once OS is gone, doing this to match OS
            4
          )
        : undefined,
    fullUniqueId: `${nft.chain}_${nft.contract_address}_${nft.token_id}`,
    // @ts-ignore TODO
    id: nft.token_id,
    image_original_url: nft.extra_metadata?.image_original_url,
    image_preview_url: lowResUrl,
    image_thumbnail_url: lowResUrl,
    image_url: imageUrl,
    isPoap: nft.contract_address.toLowerCase() === POAP_NFT_ADDRESS,
    isSendable: nft.chain === SimpleHashChain.Ethereum,
    lastPrice:
      nft?.last_sale?.unit_price !== null &&
      nft?.last_sale?.unit_price !== undefined
        ? convertRawAmountToRoundedDecimal(
            nft?.last_sale?.unit_price,
            nft?.last_sale?.payment_token?.decimals,
            3
          )
        : null,
    lastSalePaymentToken: nft.last_sale?.payment_token?.symbol,
    lowResUrl: lowResUrl || null,
    marketplaceCollectionUrl: marketplace?.collection_url,
    marketplaceId: marketplace?.marketplace_id ?? null,
    marketplaceName: marketplace?.marketplace_name ?? null,
    name: nft.name || '',
    network: getNetworkFromSimpleHashChain(nft.chain),
    permalink: marketplace?.nft_url ?? '',
    // @ts-ignore TODO
    traits: nft.extra_metadata?.attributes ?? [],
    type: AssetType.nft,
    uniqueId: isENS
      ? nft.name ?? `${nft.contract_address}_${nft.token_id}`
      : `${nft.contract_address}_${nft.token_id}`,
    urlSuffixForAsset: `${nft.contract_address}/${nft.token_id}`,
  };
}

export function simpleHashNFTToInternalNFT(nft: SimpleHashNFT): NFT {
  const lowercasedContractAddress = nft.contract_address.toLowerCase();
  const collection = nft.collection;
  const network = getNetworkFromSimpleHashChain(nft.chain);
  const floorPriceData = collection?.floor_prices?.find(
    (floorPrice: SimpleHashFloorPrice) =>
      floorPrice?.marketplace_id === SimpleHashMarketplaceId.OpenSea &&
      floorPrice?.payment_token?.payment_token_id === 'ethereum.native'
  );
  const openseaFloorPriceEth =
    getRoundedValueFromRawAmount(
      floorPriceData?.value,
      floorPriceData?.payment_token?.decimals
    ) ?? null;
  const opensea = nft.collection.marketplace_pages.find(
    (marketplace: SimpleHashMarketplace) =>
      marketplace.marketplace_id === simpleHashMarketplaceIds.opensea
  );
  const lastEthSale =
    getRoundedValueFromRawAmount(
      nft?.last_sale?.unit_price,
      nft?.last_sale?.payment_token?.decimals
    ) ?? null;
  let uniqueTokenType: UniqueTokenType = uniqueTokenTypes.NFT;
  if (lowercasedContractAddress === POAP_NFT_ADDRESS) {
    uniqueTokenType = uniqueTokenTypes.POAP;
  } else if (lowercasedContractAddress === ENS_NFT_CONTRACT_ADDRESS) {
    uniqueTokenType = uniqueTokenTypes.ENS;
  }

  // slices off url sizing suffix s=1000 - simplehash image previews are stored on google cdn
  // simplehash preview images will never be svgs, so we don't need to worry about conversion
  const fullSizeNonSVGUrl =
    nft.previews.image_large_url?.slice(-6) === GOOGLE_CDN_URL_SIZE_1000_SUFIX
      ? nft.previews.image_large_url?.slice(0, -6)
      : nft.previews.image_large_url;

  const originalImageUrl =
    nft.image_url ?? nft.extra_metadata?.image_original_url;

  // originalImageUrl may be an svg, so we need to handle that
  const safeNonSvgUrl = fullSizeNonSVGUrl ?? svgToPngIfNeeded(originalImageUrl);
  const fullResPngUrl = getFullSizePngUrl(safeNonSvgUrl) ?? null;
  const lowResPngUrl = imageToPng(safeNonSvgUrl, CardSize) ?? null;

  // fullResUrl will either be the original svg or the full res png
  const fullResUrl =
    nft.image_properties?.mime_type === SVG_MIME_TYPE
      ? originalImageUrl
      : fullResPngUrl;

  const collectionImageUrl = collection?.image_url
    ? maybeSignUri(collection.image_url) ?? null
    : null;

  return {
    backgroundColor: nft.background_color,
    collection: {
      description: collection.description,
      discord: collection.discord_url,
      externalUrl: collection.external_url,
      imageUrl: collectionImageUrl,
      name:
        uniqueTokenType === uniqueTokenTypes.ENS
          ? ENS_COLLECTION_NAME
          : collection.name,
      simplehashSpamScore: collection?.spam_score,
      twitter: collection.twitter_username,
    },
    contract: {
      address: nft.contract_address,
      name: nft.contract.name,
      standard: nft.contract.type,
      symbol: nft.contract.symbol,
    },
    description: nft.description ?? undefined,
    externalUrl: nft.external_url ?? undefined,
    images: {
      blurhash: nft.previews?.blurhash,
      fullResPngUrl,
      fullResUrl,
      lowResPngUrl,
      // mimeType only corresponds to fullResUrl
      mimeType: nft.image_properties?.mime_type ?? null,
    },
    isSendable:
      // can't send poaps because they're on gnosis
      uniqueTokenType !== uniqueTokenTypes.POAP &&
      (nft.contract.type === ERC721 || nft.contract.type === ERC1155),
    // we only show last eth sale right now for whatever reason
    lastEthSale,
    marketplaces: nft.collection.marketplace_pages.map(
      (marketplace: SimpleHashMarketplace) =>
        ({
          collectionId: marketplace?.marketplace_collection_id,
          collectionUrl: marketplace?.collection_url,
          // we only use eth floor prices right now
          floorPrice: openseaFloorPriceEth,
          id: marketplace?.marketplace_id,
          marketplaceId: marketplace?.marketplace_id,
          name: marketplace?.marketplace_name,
          nftUrl: marketplace?.nft_url,
        } as NFTMarketplace)
    ),
    name: nft.name,
    network,
    predominantColor: nft.previews?.predominant_color,
    tokenId: nft.token_id,
    traits:
      (nft.extra_metadata?.attributes
        ?.map((trait: SimpleHashTrait) => {
          if (!isNil(trait.trait_type) && !isNil(trait.value)) {
            return {
              displayType: trait?.display_type,
              traitType: trait.trait_type,
              value: trait.value,
            };
          }
        })
        ?.filter((trait: NFTTrait | undefined) => !!trait) as NFTTrait[]) ?? [],
    type: AssetTypes.nft as AssetType,
    uniqueId: `${network}_${nft.contract_address}_${nft.token_id}`,
    uniqueTokenType,
    videos: {
      mimeType: nft.video_properties?.mime_type ?? null,
      url: nft.video_url ?? nft.extra_metadata?.animation_original_url,
    },
  };
}
