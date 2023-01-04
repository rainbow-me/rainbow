import { isEmpty, isNil, result } from 'lodash';
import uniq from 'lodash/uniq';
import { CardSize } from '../components/unique-token/CardSize';
import { OpenseaPaymentTokens } from '@/references/opensea';
import { AssetType, AssetTypes, UniqueAsset } from '@/entities';
import { fetchMetadata, isUnknownOpenSeaENS } from '@/handlers/ens';
import { maybeSignUri } from '@/handlers/imgix';
import svgToPngIfNeeded from '@/handlers/svgs';
import { Network } from '@/helpers/networkTypes';
import { pickBy, pickShallow } from '@/helpers/utilities';
import { ENS_NFT_CONTRACT_ADDRESS } from '@/references';
import { getFullSizeUrl } from '@/utils/getFullSizeUrl';
import { getLowResUrl } from '@/utils/getLowResUrl';
import isSVGImage from '@/utils/isSVG';
import { SimplehashNft } from '@/handlers/simplehash';
import { UniqueAssetTrait } from '@/entities/uniqueAssets';
import { queryClient } from '@/react-query';
import { rainbowFetch } from '@/rainbow-fetch';

export const POAP_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';


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

export const handleAndSignImages = (imageUrl: string, previewUrl: string, originalUrl: string) => {
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
    ? maybeSignUri(svgToPngIfNeeded(image, false), lowResImageOptions)
    : getLowResUrl(image);

  return {
    imageUrl: fullImage,
    lowResUrl,
  };
};

export const applyENSMetadataFallbackToToken = async (token: UniqueAsset) => {
  const isENS =
    token?.asset_contract?.address?.toLowerCase() ===
    ENS_NFT_CONTRACT_ADDRESS.toLowerCase();
  if (isENS && isUnknownOpenSeaENS(token)) {
    const { name, image_url } = await fetchMetadata({
      tokenId: token.id,
    });
    const { imageUrl, lowResUrl } = handleAndSignImages(image_url, null, null);
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

export const applyENSMetadataFallbackToTokens = async( data: UniqueAsset[]) => {
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

export const parseSimplehashNfts = (nftData: SimplehashNft[]): UniqueAsset[] => {
  const results = nftData?.map((simplehashNft: SimplehashNft) => {
    const collection = simplehashNft.collection;

    const { imageUrl, lowResUrl } = handleAndSignImages(
      simplehashNft.image_url || '',
      simplehashNft.extra_metadata?.image_original_url || '',
      simplehashNft.previews.image_small_url || ''
    );

    const marketplaceInfo = getSimplehashMarketplaceInfo(simplehashNft);

    const parsedNft: UniqueAsset = {
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
      fullUniqueId: `${simplehashNft.chain}_${simplehashNft.contract_address}_${simplehashNft.token_id}`,
      id: simplehashNft.token_id,
      image_original_url: simplehashNft.extra_metadata?.image_original_url,
      image_preview_url: lowResUrl,
      image_thumbnail_url: lowResUrl,
      image_url: imageUrl,
      isPoap: false,
      isSendable: false,
      /*
      lastPrice: parseLastSalePrice(simplehashNft.last_sale?.unit_price),
      lastSalePaymentToken: simplehashNft.last_sale?.payment_token?.symbol,
      */
      lowResUrl,
      marketplaceCollectionUrl: marketplaceInfo?.collectionUrl,
      marketplaceId: marketplaceInfo?.marketplaceId,
      marketplaceName: marketplaceInfo?.marketplaceName,
      name: simplehashNft.name,
      network: simplehashNft.chain,
      permalink: marketplaceInfo?.permalink,
      traits: simplehashNft.extra_metadata?.attributes as UniqueAssetTrait[] || [],
      type: AssetType.nft,
      uniqueId: `${simplehashNft.contract_address}_${simplehashNft.token_id}`,
      urlSuffixForAsset: `${simplehashNft.contract_address}/${simplehashNft.token_id}`,
      currentPrice: null,
      lastPrice: null,
      lastPriceUsd: undefined,
      lastSale: undefined,
      lastSalePaymentToken: undefined,
      spamScore: simplehashNft.collection.spam_score,
    };
    return parsedNft;
  });

   // TODO(jxom): migrate this to Async State RFC architecture once it's merged in.
   const polygonAllowlist = await queryClient.fetchQuery(
    ['polygon-allowlist'],
    async () => {
      return (
        await rainbowFetch(
          'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
          { method: 'get' }
        )
      ).data.data.addresses;
    },
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );

  return results.filter((nft: UniqueAsset) => {
    if (nft.collection.name === null) return false;

    // filter out spam
    if (nft.spamScore >= 85) return false;

    // filter gnosis NFTs that are not POAPs
    if (
      nft.network === 'gnosis' &&
      nft.asset_contract && 
      nft?.asset_contract?.address.toLowerCase() !== POAP_ADDRESS
    )
      return false;

      if (nft.network == Network.polygon &&
        !polygonAllowlist.includes(nft.asset_contract?.address?.toLowerCase())){
          return false;
        }

    return true;
  });;
};
