import { CardSize } from '../components/unique-token/CardSize';
import { AssetType, AssetTypes, UniqueAsset } from '@/entities';
import { maybeSignUri, imageToPng } from '@/handlers/imgix';
import svgToPngIfNeeded from '@/handlers/svgs';
import { Network } from '@/helpers/networkTypes';
import { ENS_NFT_CONTRACT_ADDRESS, POAP_NFT_ADDRESS } from '@/references';
import { getFullSizePngUrl } from '@/utils/getFullSizePngUrl';
import { getLowResUrl } from '@/utils/getLowResUrl';
import isSVGImage from '@/utils/isSVG';
import { UniqueTokenType, uniqueTokenTypes } from '@/utils/uniqueTokens';
import { Trait } from '@/entities/uniqueAssets';
import {
  SimplehashFloorPrice,
  SimplehashMarketplace,
  SimplehashNft,
  SimplehashTrait,
} from '@/entities/simplehash';

const SVG_MIME_TYPE = 'image/svg+xml';

// const parseLastSalePrice = lastSale =>
//   lastSale
//     ? Math.round(
//         (lastSale?.total_price / 1000000000000000000 + Number.EPSILON) * 1000
//       ) / 1000
//     : null;

// const getCurrentPrice = ({ currentPrice, token }) => {
//   if (!token || !currentPrice) {
//     return null;
//   }

//   const paymentToken = OpenseaPaymentTokens.find(
//     osToken => osToken.address.toLowerCase() === token.toLowerCase()
//   );

//   if (!currentPrice || !paymentToken) return null;
//   // Use the decimals returned from the token list to calculate a human readable value. Add 1 to decimals as padEnd includes the first digit
//   const price =
//     Number(currentPrice) / Number('1'.padEnd(paymentToken.decimals + 1, '0'));

//   return `${price} ${paymentToken.symbol}`;
// };

export const getOpenSeaCollectionUrl = (slug: string) =>
  `https://opensea.io/collection/${slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`;

/**
 * @desc signs and handles low res + full res images
 * @param  {Object}
 * @return {Object}
 */

export const handleAndSignImages = (
  originalImageUrl: string,
  nonSVGUrl: string,
  isSVG: string
) => {
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

export const getNetworkFromSimplehashChain = (chain: string) =>
  // techinically we don't support gnosis but we can still get gnosis nfts
  chain === 'ethereum' || chain === 'gnosis'
    ? Network.mainnet
    : (chain as Network);

export const getSimplehashChainFromNetwork = (network: Network) =>
  network === Network.mainnet ? 'ethereum' : network;

const getRoundedValueFromRawAmount = (rawAmount: number, decimals: number) => {
  if (rawAmount && decimals) {
    return Math.round(rawAmount * 10 ** -decimals * 1000) / 1000;
  }
  return null;
};

export const parseSimplehashNfts = (nftData: SimplehashNft[]) => {
  const results = nftData?.map((simplehashNft: SimplehashNft) => {
    const address = simplehashNft.contract_address.toLowerCase();
    const collection = simplehashNft.collection;
    const name = simplehashNft.name;
    const network = getNetworkFromSimplehashChain(simplehashNft.chain);
    const openSeaFloorPriceEth = collection?.floor_prices?.find(
      (floorPrice: SimplehashFloorPrice) =>
        floorPrice?.marketplace_id === 'opensea' &&
        floorPrice?.payment_token?.payment_token_id === 'ethereum.native'
    );
    const openSea = simplehashNft.collection.marketplace_pages.find(
      (marketplace: SimplehashMarketplace) =>
        marketplace.marketplace_id === 'opensea'
    );
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
      !openSea ||
      !simplehashNft?.token_id
    ) {
      return;
    }

    //
    // handle images
    //

    // slices off url sizing suffix s=1000 - simplehash image previews are stored on google cdn
    // simplehash preview images will never be svgs, so we don't need to worry about conversion
    const fullSizeNonSVGUrl = simplehashNft.previews.image_large_url?.slice(
      0,
      -6
    );

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
        mimeType: simplehashNft.image_properties?.mime_type ?? null,
      },
      isSendable:
        uniqueTokenType !== uniqueTokenTypes.POAP &&
        (simplehashNft.contract.type === 'ERC721' ||
          simplehashNft.contract.type === 'ERC1155'),
      lastSale: simplehashNft.last_sale,
      marketplaces: {
        opensea: {
          collectionId: openSea?.marketplace_collection_id ?? null,
          collectionUrl: openSea?.collection_url ?? null,
          // we only use eth floor prices right now
          floorPrice: openSeaFloorPriceEth
            ? getRoundedValueFromRawAmount(
                openSeaFloorPriceEth?.value,
                openSeaFloorPriceEth?.payment_token?.decimals
              ) ?? null
            : null,
          id: openSea?.marketplace_id ?? null,
          name: openSea?.marketplace_name ?? null,
          nftUrl: openSea?.nft_url ?? null,
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
        url: simplehashNft.video_url,
      },
    };
  });
  return results.filter((nft: UniqueAsset | undefined) => !!nft);
};
