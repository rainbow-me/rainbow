import { AssetType, AssetTypes } from '@/entities';
import { UniqueAsset } from '@/entities/uniqueAssets';
import {
  SimpleHashNFT,
  ValidatedSimpleHashNFT,
  SimpleHashChain,
  SimpleHashFloorPrice,
  SimpleHashMarketplaceId,
  SimpleHashTrait,
  SimpleHashMarketplace,
} from '@/resources/nfts/simplehash/types';
import { Network } from '@/helpers/networkTypes';
import {
  ENS_NFT_CONTRACT_ADDRESS,
  ETH_ADDRESS,
  POAP_NFT_ADDRESS,
} from '@/references';
import { convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import {
  NFT,
  NFTFloorPrice,
  NFTMarketplace,
  NFTMarketplaceId,
  NFTTrait,
  PolygonAllowlist,
} from '../types';
import svgToPngIfNeeded from '@/handlers/svgs';
import { maybeSignUri } from '@/handlers/imgix';
import { CardSize } from '@/components/unique-token/CardSize';
import { isNil } from 'lodash';
import { UniqueTokenType, uniqueTokenTypes } from '@/utils/uniqueTokens';
import { PixelRatio } from 'react-native';
import { deviceUtils } from '@/utils';
import { TokenStandard } from '@/handlers/web3';
import { handleNFTImages } from '@/utils/handleNFTImages';

const ENS_COLLECTION_NAME = 'ENS';
const SVG_MIME_TYPE = 'image/svg+xml';
const pixelRatio = PixelRatio.get();
const deviceWidth = deviceUtils.dimensions.width;
const size = deviceWidth * pixelRatio;
const MAX_IMAGE_SCALE = 3;
const FULL_NFT_IMAGE_SIZE = size * MAX_IMAGE_SCALE;
const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';

// same thing here, seems like only difference is we use mainnet instead of ethereum
/**
 * Returns a `SimpleHashChain` from a given `Network`. Can return undefined if
 * a `Network` has no counterpart in SimpleHash.
 * @param network `Network`
 * @returns `SimpleHashChain` or `undefined`
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
    case Network.zora:
      return SimpleHashChain.Zora;
    default:
      return undefined;
  }
}

/**
 * Returns a `Network` from a `SimpleHashChain`. If an invalid value is
 * forcably passed in, it will throw.
 * @param chain `SimpleHashChain`
 * @returns `Network`
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
    case SimpleHashChain.Zora:
      return Network.zora;
    case SimpleHashChain.Base:
      return Network.base;
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
 * Filters out NFTs that do not have a name, collection name,
 * contract address, or token id, Gnosis NFTs that are not POAPs,
 * NFTs that are not on a supported `Network`, and Polygon NFTs
 * that are not present in the provided allowlist.
 * @param nfts array of `SimpleHashNFT`s
 * @param polygonAllowlist array of Polygon nft contract addresses to allowlist
 * @returns filtered array of `ValidatedSimpleHashNFT`s
 */
export function filterSimpleHashNFTs(
  nfts: SimpleHashNFT[],
  polygonAllowlist?: PolygonAllowlist
): ValidatedSimpleHashNFT[] {
  return nfts
    .filter(nft => {
      const lowercasedContractAddress = nft.contract_address?.toLowerCase();
      const network = getNetworkFromSimpleHashChain(nft.chain);

      const isMissingRequiredFields =
        !nft.name ||
        !nft.collection?.name ||
        !nft.contract_address ||
        !nft.token_id ||
        !network;
      const isPolygonAndNotAllowed =
        polygonAllowlist &&
        nft.chain === SimpleHashChain.Polygon &&
        !polygonAllowlist[lowercasedContractAddress];
      const isGnosisAndNotPOAP =
        nft.chain === SimpleHashChain.Gnosis &&
        lowercasedContractAddress !== POAP_NFT_ADDRESS;

      if (
        isMissingRequiredFields ||
        isPolygonAndNotAllowed ||
        isGnosisAndNotPOAP
      ) {
        return false;
      }

      return true;
    })
    .map(nft => ({
      ...nft,
      name: nft.name!,
      contract_address: nft.contract_address,
      chain: getNetworkFromSimpleHashChain(nft.chain),
      collection: { ...nft.collection, name: nft.collection.name! },
      token_id: nft.token_id!,
    }));
}

/**
 * Maps a `SimpleHashNFT` to a `UniqueAsset`.
 * @param nft `SimpleHashNFT`
 * @returns `UniqueAsset`
 */
export function simpleHashNFTToUniqueAsset(
  nft: ValidatedSimpleHashNFT
): UniqueAsset {
  const collection = nft.collection;
  const lowercasedContractAddress = nft.contract_address?.toLowerCase();

  const { highResUrl: imageUrl, lowResUrl } = handleNFTImages({
    originalUrl: nft.image_url ?? nft.extra_metadata?.image_original_url,
    previewUrl: nft.previews.image_large_url,
    mimeType: nft.image_properties?.mime_type,
  });

  const marketplace = nft.collection.marketplace_pages?.[0];

  const floorPrice = collection?.floor_prices?.find(
    (floorPrice: SimpleHashFloorPrice) =>
      floorPrice?.marketplace_id === SimpleHashMarketplaceId.OpenSea &&
      floorPrice?.payment_token?.payment_token_id === 'ethereum.native'
  );

  const isENS = lowercasedContractAddress === ENS_NFT_CONTRACT_ADDRESS;

  const standard = nft.contract.type;

  const isPoap = nft.contract_address.toLowerCase() === POAP_NFT_ADDRESS;

  return {
    animation_url:
      nft?.video_url ??
      nft.audio_url ??
      nft.model_url ??
      nft.extra_metadata?.animation_original_url ??
      undefined,
    asset_contract: {
      address: lowercasedContractAddress,
      name: nft.contract.name || undefined,
      schema_name: standard,
      symbol: nft.contract.symbol || undefined,
    },
    background: nft.background_color,
    collection: {
      description: collection.description,
      discord_url: collection.discord_url,
      external_url: collection.external_url,
      image_url: collection.image_url,
      name: isENS ? 'ENS' : collection.name,
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
    id: nft.token_id,
    image_original_url: nft.extra_metadata?.image_original_url,
    image_preview_url: lowResUrl,
    image_thumbnail_url: lowResUrl,
    image_url: imageUrl,
    isPoap,
    isSendable:
      !isPoap &&
      (nft.contract.type === TokenStandard.ERC721 ||
        nft.contract.type === TokenStandard.ERC1155),
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
    name: nft.name,
    network: nft.chain,
    permalink: marketplace?.nft_url ?? '',
    predominantColor: nft.previews?.predominant_color ?? undefined,
    // @ts-ignore TODO
    traits: nft.extra_metadata?.attributes ?? [],
    type: AssetType.nft,
    uniqueId: isENS
      ? nft.name ?? `${nft.contract_address}_${nft.token_id}`
      : `${nft.contract_address}_${nft.token_id}`,
    urlSuffixForAsset: `${nft.contract_address}/${nft.token_id}`,
    video_url: nft.video_url,
    video_properties: nft.video_properties,
    audio_url: nft.audio_url,
    audio_properties: nft.audio_properties,
    model_url: nft.model_url,
    model_properties: nft.model_properties,
  };
}

/**
 * DELETE ME, use `handleNFTImages` instead.
 *
 * Reformats, resizes and signs images provided by simplehash.
 * @param original original image url
 * @param preview preview image url
 * @param isSVG whether the original image is an svg
 * @returns fullResPngUrl, lowResPngUrl, fullResUrl
 */
function handleImages(
  original: string | null | undefined,
  preview: string | null | undefined,
  isSVG: boolean
): {
  fullResPngUrl: string | undefined;
  lowResPngUrl: string | undefined;
  fullResUrl: string | undefined;
} {
  if (!original && !preview) {
    return {
      fullResPngUrl: undefined,
      lowResPngUrl: undefined,
      fullResUrl: undefined,
    };
  }

  const nonSVGUrl =
    // simplehash previews are (supposedly) never svgs
    // they are (supposed to be) google cdn urls that are suffixed with an image size parameter
    // we need to trim off the size suffix to get the full size image
    preview?.startsWith?.(GOOGLE_USER_CONTENT_URL)
      ? preview.replace(/=s\d+$/, '')
      : // fallback to the original image url if we don't have a preview url of the expected format
        svgToPngIfNeeded(original);

  const fullResPngUrl = maybeSignUri(nonSVGUrl, {
    fm: 'png',
    w: FULL_NFT_IMAGE_SIZE,
  });
  const lowResPngUrl = maybeSignUri(nonSVGUrl, {
    fm: 'png',
    w: CardSize,
  });
  const fullResUrl = isSVG && original ? original : fullResPngUrl;

  return { fullResPngUrl, lowResPngUrl, fullResUrl };
}

/**
 * Returns an NFT's `UniqueTokenType`.
 * @param contractAddress NFT contract address
 * @returns `UniqueTokenType`
 */
function getUniqueTokenType(contractAddress: string): UniqueTokenType {
  switch (contractAddress) {
    case POAP_NFT_ADDRESS:
      return uniqueTokenTypes.POAP;
    case ENS_NFT_CONTRACT_ADDRESS:
      return uniqueTokenTypes.ENS;
    default:
      return uniqueTokenTypes.NFT;
  }
}

/**
 * Converts a `SimpleHashMarketplaceId` to a `NFTMarketplaceId`, or returns undefined
 * @param marketplaceId `SimpleHashMarketplaceId`
 * @returns `NFTMarketplaceId` or `undefined`
 */
function getInternalMarketplaceIdFromSimpleHashMarketplaceId(
  marketplaceId: SimpleHashMarketplaceId
): NFTMarketplaceId | undefined {
  switch (marketplaceId) {
    case SimpleHashMarketplaceId.OpenSea:
      return NFTMarketplaceId.OpenSea;
    default:
      return undefined;
  }
}

/**
 * Maps a `ValidatedSimpleHashNFT` to a `NFT`. Use `filterSimpleHashNFTs` to
 * generate an array of `ValidatedSimpleHashNFT`s.
 * @param nft `ValidatedSimpleHashNFT`
 * @returns `NFT`
 */
export function simpleHashNFTToInternalNFT(nft: ValidatedSimpleHashNFT): NFT {
  const collection = nft.collection;
  const lowercasedContractAddress = nft.contract_address.toLowerCase();

  const uniqueTokenType = getUniqueTokenType(lowercasedContractAddress);

  const { fullResPngUrl, lowResPngUrl, fullResUrl } = handleImages(
    nft.image_url ?? nft.extra_metadata?.image_original_url,
    nft.previews?.image_large_url,
    nft.image_properties?.mime_type === SVG_MIME_TYPE
  );

  // filter out unsupported marketplaces
  const marketplaces = nft.collection.marketplace_pages
    .filter(
      m =>
        !!getInternalMarketplaceIdFromSimpleHashMarketplaceId(m.marketplace_id)
    )
    .map((m: SimpleHashMarketplace) => {
      const marketplace: NFTMarketplace = {
        collectionId: m?.marketplace_collection_id,
        collectionUrl: m?.collection_url,
        marketplaceId: getInternalMarketplaceIdFromSimpleHashMarketplaceId(
          m.marketplace_id
        )!,
        name: m?.marketplace_name,
        nftUrl: m?.nft_url,
      };

      return marketplace;
    });

  // filter out traits that are missing key attributes
  const traits = nft.extra_metadata?.attributes
    ? nft.extra_metadata.attributes
        .filter((t: SimpleHashTrait) => !isNil(t.trait_type) && !isNil(t.value))
        .map((t: SimpleHashTrait) => {
          const trait: NFTTrait = {
            displayType: t.display_type!,
            traitType: t.trait_type,
            value: t.value,
          };

          return trait;
        })
    : [];

  // filter out floor prices that are from unsupported marketplaces or have invalid payment tokens
  const floorPrices = collection.floor_prices
    .filter(
      (f: SimpleHashFloorPrice) =>
        getInternalMarketplaceIdFromSimpleHashMarketplaceId(f.marketplace_id) &&
        f.payment_token?.name &&
        f.payment_token?.symbol
    )
    .map((f: SimpleHashFloorPrice) => {
      const floorPrice: NFTFloorPrice = {
        marketplaceId: getInternalMarketplaceIdFromSimpleHashMarketplaceId(
          f.marketplace_id
        )!,
        paymentToken: {
          address: f.payment_token.address ?? ETH_ADDRESS,
          decimals: f.payment_token.decimals,
          name: f.payment_token.name!,
          symbol: f.payment_token.symbol!,
        },
        value: f.value,
      };

      return floorPrice;
    });

  return {
    backgroundColor: nft.background_color ?? undefined,
    collection: {
      description: collection.description ?? undefined,
      discord: collection.discord_url ?? undefined,
      externalUrl: collection.external_url ?? undefined,
      floorPrices,
      imageUrl: collection.image_url
        ? maybeSignUri(collection.image_url)
        : undefined,
      name:
        uniqueTokenType === uniqueTokenTypes.ENS
          ? ENS_COLLECTION_NAME
          : collection.name,
      simpleHashSpamScore: collection?.spam_score ?? undefined,
      twitter: collection.twitter_username ?? undefined,
    },
    contract: {
      address: lowercasedContractAddress,
      name: nft.contract.name ?? undefined,
      schema_name: nft.contract.type,
      symbol: nft.contract.symbol ?? undefined,
    },
    description: nft.description ?? undefined,
    externalUrl: nft.external_url ?? undefined,
    images: {
      blurhash: nft.previews?.blurhash ?? undefined,
      fullResPngUrl,
      fullResUrl,
      lowResPngUrl,
      // mimeType only corresponds to fullResUrl
      mimeType: nft.image_properties?.mime_type ?? undefined,
    },
    isSendable:
      uniqueTokenType !== uniqueTokenTypes.POAP &&
      (nft.contract.type === TokenStandard.ERC721 ||
        nft.contract.type === TokenStandard.ERC1155),
    lastSale:
      nft.last_sale?.payment_token?.name &&
      nft.last_sale?.payment_token?.symbol &&
      !isNil(nft.last_sale?.unit_price)
        ? {
            paymentToken: {
              address: nft.last_sale?.payment_token.address ?? ETH_ADDRESS,
              decimals: nft.last_sale?.payment_token.decimals,
              name: nft.last_sale?.payment_token.name,
              symbol: nft.last_sale?.payment_token.symbol,
            },
            value: nft.last_sale?.unit_price!,
          }
        : undefined,
    marketplaces,
    name: nft.name,
    network: nft.chain,
    predominantColor: nft.previews?.predominant_color ?? undefined,
    tokenId: nft.token_id,
    traits,
    type: AssetTypes.nft as AssetType,
    uniqueId: `${nft.chain}_${nft.contract_address}_${nft.token_id}`,
    uniqueTokenType,
    video_url: maybeSignUri(
      nft.video_url ?? nft.extra_metadata?.animation_original_url ?? undefined,
      { fm: 'mp4' }
    ),
  };
}
