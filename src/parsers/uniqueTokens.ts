import { CardSize } from '../components/unique-token/CardSize';
import { AssetType, AssetTypes, UniqueAsset } from '@/entities';
import { maybeSignUri, imageToPng } from '@/handlers/imgix';
import svgToPngIfNeeded from '@/handlers/svgs';
import { Network } from '@/helpers/networkTypes';
import { ENS_NFT_CONTRACT_ADDRESS, POAP_NFT_ADDRESS } from '@/references';
import { getFullSizePngUrl } from '@/utils/getFullSizePngUrl';
import { UniqueTokenType, uniqueTokenTypes } from '@/utils/uniqueTokens';
import { Trait } from '@/entities/uniqueAssets';
import {
  simplehashChains,
  SimplehashFloorPrice,
  SimplehashMarketplace,
  simplehashMarketplaceIds,
  SimplehashNft,
  simplehashPaymentTokenIds,
  SimplehashTrait,
} from '@/entities/simplehash';

const SVG_MIME_TYPE = 'image/svg+xml';
const GOOGLE_CDN_URL_SIZE_1000_SUFIX = '=s1000';

export const getNetworkFromSimplehashChain = (chain: string) =>
  // techinically we don't support gnosis but we can still get gnosis nfts
  chain === simplehashChains.ethereum || chain === simplehashChains.gnosis
    ? Network.mainnet
    : (chain as Network);

export const getSimplehashChainFromNetwork = (network: Network) =>
  network === Network.mainnet ? 'ethereum' : network;

const getRoundedValueFromRawAmount = (
  rawAmount: number | null | undefined,
  decimals: number | null | undefined
) => {
  if (rawAmount && decimals) {
    return Math.round(rawAmount * 10 ** -decimals * 1000) / 1000;
  }
};

export const parseSimplehashNfts = (
  nftData: SimplehashNft[],
  polygonAllowlist: string[]
): UniqueAsset[] => {
  const results = nftData?.map((simplehashNft: SimplehashNft) => {
    const address = simplehashNft.contract_address.toLowerCase();
    const collection = simplehashNft.collection;
    const name = simplehashNft.name;
    const network = getNetworkFromSimplehashChain(simplehashNft.chain);
    const floorPriceData = collection?.floor_prices?.find(
      (floorPrice: SimplehashFloorPrice) =>
        floorPrice?.marketplace_id === simplehashMarketplaceIds.opensea &&
        floorPrice?.payment_token?.payment_token_id ===
          simplehashPaymentTokenIds.eth
    );
    const openseaFloorPriceEth =
      getRoundedValueFromRawAmount(
        floorPriceData?.value,
        floorPriceData?.payment_token?.decimals
      ) ?? null;
    const opensea = simplehashNft.collection.marketplace_pages.find(
      (marketplace: SimplehashMarketplace) =>
        marketplace.marketplace_id === simplehashMarketplaceIds.opensea
    );
    const lastEthSale =
      getRoundedValueFromRawAmount(
        simplehashNft?.last_sale?.unit_price,
        simplehashNft?.last_sale?.payment_token?.decimals
      ) ?? null;
    let uniqueTokenType: UniqueTokenType = uniqueTokenTypes.NFT;
    if (address === POAP_NFT_ADDRESS) {
      uniqueTokenType = uniqueTokenTypes.POAP;
    } else if (address === ENS_NFT_CONTRACT_ADDRESS) {
      uniqueTokenType = uniqueTokenTypes.ENS;
    }

    // if any of these are missing, we shouldn't attempt to show the nft to the user
    if (
      !address ||
      !collection?.name ||
      !name ||
      !network ||
      !simplehashNft?.token_id ||
      collection.spam_score === null ||
      collection.spam_score >= 85 ||
      (network === Network.gnosis &&
        uniqueTokenType !== uniqueTokenTypes.POAP) ||
      (network === Network.polygon &&
        !polygonAllowlist.includes(
          simplehashNft.contract_address?.toLowerCase()
        ))
    ) {
      return;
    }

    //
    // handle images
    //

    // slices off url sizing suffix s=1000 - simplehash image previews are stored on google cdn
    // simplehash preview images will never be svgs, so we don't need to worry about conversion
    const fullSizeNonSVGUrl =
      simplehashNft.previews.image_large_url?.slice(-6) ===
      GOOGLE_CDN_URL_SIZE_1000_SUFIX
        ? simplehashNft.previews.image_large_url?.slice(0, -6)
        : simplehashNft.previews.image_large_url;

    const originalImageUrl =
      simplehashNft.image_url ??
      simplehashNft.extra_metadata?.image_original_url;

    // originalImageUrl may be an svg, so we need to handle that
    const safeNonSvgUrl =
      fullSizeNonSVGUrl ?? svgToPngIfNeeded(originalImageUrl);
    const fullResPngUrl = getFullSizePngUrl(safeNonSvgUrl) ?? null;
    const lowResPngUrl = imageToPng(safeNonSvgUrl, CardSize) ?? null;

    // fullResUrl will either be the original svg or the full res png
    const fullResUrl =
      simplehashNft.image_properties?.mime_type === SVG_MIME_TYPE
        ? originalImageUrl
        : fullResPngUrl;

    const collectionImageUrl = collection?.image_url
      ? maybeSignUri(collection.image_url) ?? null
      : null;

    return {
      backgroundColor: simplehashNft.background_color,
      collection: {
        description: collection.description,
        discord: collection.discord_url,
        externalUrl: collection.external_url,
        imageUrl: collectionImageUrl,
        name:
          uniqueTokenType === uniqueTokenTypes.ENS ? 'ENS' : collection.name,
        simplehashSpamScore: collection?.spam_score,
        twitter: collection.twitter_username,
      },
      contract: {
        address: simplehashNft.contract_address,
        name: simplehashNft.contract.name,
        standard: simplehashNft.contract.type,
        symbol: simplehashNft.contract.symbol,
      },
      description: simplehashNft.description,
      externalUrl: simplehashNft.external_url,
      images: {
        blurhash: simplehashNft.previews?.blurhash,
        fullResPngUrl,
        fullResUrl,
        lowResPngUrl,
        // mimeType only corresponds to fullResUrl
        mimeType: simplehashNft.image_properties?.mime_type ?? null,
      },
      isSendable:
        uniqueTokenType !== uniqueTokenTypes.POAP &&
        (simplehashNft.contract.type === 'ERC721' ||
          simplehashNft.contract.type === 'ERC1155'),
      // we only show last eth sale right now for whatever reason
      lastEthSale,
      marketplaces: {
        opensea: {
          collectionId: opensea?.marketplace_collection_id ?? null,
          collectionUrl: opensea?.collection_url ?? null,
          // we only use eth floor prices right now
          floorPrice: openseaFloorPriceEth ?? null,
          id: opensea?.marketplace_id ?? null,
          name: opensea?.marketplace_name ?? null,
          nftUrl: opensea?.nft_url ?? null,
        },
      },
      name,
      network,
      predominantColor: simplehashNft.previews?.predominant_color,
      tokenId: simplehashNft.token_id,
      traits:
        (simplehashNft.extra_metadata?.attributes
          ?.map((trait: SimplehashTrait) => {
            if (
              trait.trait_type !== null &&
              trait.trait_type !== undefined &&
              trait.value !== null &&
              trait.value !== undefined
            ) {
              return {
                displayType: trait?.display_type,
                traitType: trait.trait_type,
                value: trait.value,
              };
            }
          })
          ?.filter((trait: Trait | undefined) => !!trait) as Trait[]) ?? [],
      type: AssetTypes.nft as AssetType,
      uniqueId: `${network}_${simplehashNft.contract_address}_${simplehashNft.token_id}`,
      uniqueTokenType,
      videos: {
        mimeType: simplehashNft.video_properties?.mime_type ?? null,
        url:
          simplehashNft.video_url ??
          simplehashNft.extra_metadata?.animation_original_url,
      },
    };
  });
  return results.filter(
    (nft: UniqueAsset | undefined) => !!nft
  ) as UniqueAsset[];
};
