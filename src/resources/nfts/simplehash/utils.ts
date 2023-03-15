import { AssetType } from '@/entities';
import { UniqueAsset } from '@/entities/uniqueAssets';
import {
  SimplehashNFT,
  SimplehashChain,
  SimplehashFloorPrice,
  SimplehashMarketplaceId,
  SimplehashPaymentTokenId,
} from '@/resources/nfts/simplehash/types';
import { Network } from '@/helpers/networkTypes';
import { handleAndSignImages } from '@/utils/handleAndSignImages';
import { POAP_NFT_ADDRESS } from '@/references';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';

/**
 * Returns a `SimplehashChain` from a given `Network`. Can return undefined if
 * a `Network` has no counterpart in Simplehash.
 */
export function getSimplehashChainFromNetwork(
  network: Omit<Network, Network.goerli>
): SimplehashChain | undefined {
  switch (network) {
    case Network.mainnet:
      return SimplehashChain.Ethereum;
    case Network.polygon:
      return SimplehashChain.Polygon;
    case Network.arbitrum:
      return SimplehashChain.Arbitrum;
    case Network.optimism:
      return SimplehashChain.Optimism;
    case Network.bsc:
      return SimplehashChain.Bsc;
    default:
      return undefined;
  }
}

/**
 * Returns a `Network` from a `SimplehashChain`. If an invalid value is
 * forcably passed in, it will throw.
 */
export function getNetworkFromSimplehashChain(chain: SimplehashChain): Network {
  switch (chain) {
    case SimplehashChain.Ethereum:
    case SimplehashChain.Gnosis:
      return Network.mainnet;
    case SimplehashChain.Polygon:
      return Network.polygon;
    case SimplehashChain.Arbitrum:
      return Network.arbitrum;
    case SimplehashChain.Optimism:
      return Network.optimism;
    case SimplehashChain.Bsc:
      return Network.bsc;
    default:
      /*
       * Throws here because according to TS types, we should NEVER hit this
       * default branch in the logic
       */
      throw new Error(
        `getNetworkFromSimplehashChain received unknown chain: ${chain}`
      );
  }
}

/**
 * This function filters out NFTs that do not have a name, collection name,
 * contract address, or token id. It also filters out Polygon NFTs that are
 * not whitelisted by our allowlist, as well as Gnosis NFTs that are not POAPs.
 *
 * @param nfts array of SimplehashNFTs
 * @param polygonAllowlist array of whitelisted Polygon nft contract addresses
 * @returns array of filtered NFTs
 */
export function filterSimplehashNFTs(
  nfts: SimplehashNFT[],
  polygonAllowlist?: string[]
): SimplehashNFT[] {
  return nfts.filter(nft => {
    if (
      !nft.name ||
      !nft.collection?.name ||
      !nft.contract_address ||
      !nft.token_id
    ) {
      return false;
    }
    if (polygonAllowlist && nft.chain === SimplehashChain.Polygon) {
      return polygonAllowlist?.includes(nft.contract_address?.toLowerCase());
    }
    if (nft.chain === SimplehashChain.Gnosis) {
      return nft.contract_address.toLowerCase() === POAP_NFT_ADDRESS;
    }
    return true;
  });
}

export function simplehashNFTToUniqueAsset(nft: SimplehashNFT): UniqueAsset {
  const collection = nft.collection;

  const { imageUrl, lowResUrl } = handleAndSignImages(
    // @ts-ignore
    nft.image_url,
    nft.previews.image_large_url,
    nft.extra_metadata?.image_original_url
  );

  const marketplace = nft.collection.marketplace_pages?.[0];

  const floorPrice = collection?.floor_prices?.find(
    (floorPrice: SimplehashFloorPrice) =>
      floorPrice?.marketplace_id === SimplehashMarketplaceId.Opensea &&
      floorPrice?.payment_token?.payment_token_id ===
        SimplehashPaymentTokenId.Ethereum
  );

  return {
    animation_url: nft.video_url,
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
      name: collection.name || '',
      slug: marketplace?.marketplace_collection_id,
      twitter_username: collection.twitter_username,
    },
    description: nft.description,
    external_link: nft.external_url,
    familyImage: collection.image_url,
    familyName: collection.name,
    floorPriceEth: floorPrice?.value
      ? convertRawAmountToDecimalFormat(
          floorPrice.value,
          floorPrice?.payment_token?.decimals,
          3
        )
      : undefined,
    fullUniqueId: `${nft.chain}_${nft.contract_address}_${nft.token_id}`,
    id: nft.token_id ?? '',
    image_original_url: nft.extra_metadata?.image_original_url,
    image_preview_url: lowResUrl,
    image_thumbnail_url: lowResUrl,
    image_url: imageUrl,
    isPoap: nft.contract_address.toLowerCase() === POAP_NFT_ADDRESS,
    isSendable: nft.chain === SimplehashChain.Ethereum,
    lastPrice: nft?.last_sale?.unit_price
      ? convertRawAmountToDecimalFormat(
          nft.last_sale.unit_price,
          nft.last_sale.payment_token?.decimals,
          3
        )
      : undefined,
    lastSalePaymentToken: nft.last_sale?.payment_token?.symbol,
    lowResUrl: lowResUrl || null,
    marketplaceCollectionUrl: marketplace?.collection_url,
    marketplaceId: marketplace?.marketplace_id,
    marketplaceName: marketplace?.marketplace_name,
    name: nft.name || '',
    network: getNetworkFromSimplehashChain(nft.chain),
    permalink: marketplace?.nft_url,
    //@ts-ignore
    traits: nft.extra_metadata?.attributes ?? [],
    type: AssetType.nft,
    uniqueId: `${nft.contract_address}_${nft.token_id}`,
    urlSuffixForAsset: `${nft.contract_address}/${nft.token_id}`,
  };
}
