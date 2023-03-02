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

export const parseSimplehashNfts = (nftData: any) => {
  const results = nftData?.map((simplehashNft: any) => {
    const collection = simplehashNft.collection;

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

    const openSeaFloorPriceEth = collection?.floor_prices?.find(
      (floorPrice: any) =>
        floorPrice?.marketplace_id === 'opensea' &&
        floorPrice?.payment_token?.payment_token_id === 'ethereum.native'
    );

    const openSea = simplehashNft.collection.marketplace_pages.find(
      (marketplace: any) => marketplace.marketplace_id === 'opensea'
    );

    const network = getNetworkFromSimplehashChain(simplehashNft.chain);

    let uniqueTokenType: UniqueTokenType = uniqueTokenTypes.NFT;
    if (simplehashNft.contract_address.toLowerCase() === POAP_NFT_ADDRESS) {
      uniqueTokenType = uniqueTokenTypes.POAP;
    } else if (
      simplehashNft.contract_address.toLowerCase() === ENS_NFT_CONTRACT_ADDRESS
    ) {
      uniqueTokenType = uniqueTokenTypes.ENS;
    }

    const parsedNft: UniqueAsset = {
      videos: {
        url: simplehashNft.video_url,
        mimeType: simplehashNft.video_properties?.mime_type,
      },
      contract: {
        address: simplehashNft.contract_address,
        name: simplehashNft.contract.name,
        standard: simplehashNft.contract.type,
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
      isSendable:
        uniqueTokenType !== uniqueTokenTypes.POAP &&
        (simplehashNft.contract.type === 'ERC721' ||
          simplehashNft.contract.type === 'ERC1155'),
      lastSale: simplehashNft.last_sale,
      name: simplehashNft.name,
      network,
      traits:
        simplehashNft.extra_metadata?.attributes?.map((trait: any) => ({
          displayType: trait?.display_type,
          traitType: trait.trait_type,
          value: trait.value,
        })) ?? [],
      type: AssetTypes.nft as AssetType,
      uniqueTokenType,
      collection: {
        imageUrl: maybeSignUri(collection.image_url) ?? null,
        name:
          uniqueTokenType === uniqueTokenTypes.ENS ? 'ENS' : collection.name,
        description: collection.description,
        externalUrl: collection.external_url,
        twitter: collection.twitter_username,
        discord: collection.discord_url,
        simplehashSpamScore: collection?.spam_score,
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
  return results.filter((nft: UniqueAsset) => !!nft);
};
