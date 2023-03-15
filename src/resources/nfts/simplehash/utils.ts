import { AssetType } from '@/entities';
import { UniqueAsset } from '@/entities/uniqueAssets';
import {
  SimpleHashNFT,
  SimpleHashChain,
} from '@/resources/nfts/simpleHash/types';
import { Network } from '@/helpers/networkTypes';
import { handleAndSignImages } from '@/utils/handleAndSignImages';
import { POAP_NFT_ADDRESS } from '@/references';

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

export function getPriceFromLastSale(
  lastSale: SimpleHashNFT['last_sale']
): number | undefined {
  return lastSale && lastSale?.total_price
    ? Math.round(
        (lastSale.total_price / 1_000_000_000_000_000_000 + Number.EPSILON) *
          1000
      ) / 1000
    : undefined;
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
  polygonAllowlist?: string[]
): SimpleHashNFT[] {
  return nfts.filter(nft => {
    if (
      !nft.name ||
      !nft.collection?.name ||
      !nft.contract_address ||
      !nft.token_id
    ) {
      return false;
    }
    if (polygonAllowlist && nft.chain === SimpleHashChain.Polygon) {
      return polygonAllowlist?.includes(nft.contract_address);
    }
    if (nft.chain === SimpleHashChain.Gnosis) {
      return nft.contract_address.toLowerCase() === POAP_NFT_ADDRESS;
    }
    return true;
  });
}

export function simpleHashNFTToUniqueAsset(nft: SimpleHashNFT): UniqueAsset {
  const collection = nft.collection;

  const { imageUrl, lowResUrl } = handleAndSignImages(
    // @ts-ignore
    nft.image_url,
    nft.extra_metadata?.image_original_url,
    nft.previews.image_small_url
  );

  const marketplace = nft.collection.marketplace_pages?.[0];

  return {
    animation_url: nft.extra_metadata?.animation_original_url,
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
    fullUniqueId: `${nft.chain}_${nft.contract_address}_${nft.token_id}`,
    // @ts-ignore TODO
    id: nft.token_id,
    image_original_url: nft.extra_metadata?.image_original_url,
    image_preview_url: lowResUrl,
    image_thumbnail_url: lowResUrl,
    image_url: imageUrl,
    isPoap: nft.contract_address.toLowerCase() === POAP_NFT_ADDRESS,
    isSendable: nft.chain === SimpleHashChain.Ethereum,
    lastPrice: getPriceFromLastSale(nft.last_sale) || null,
    lastSalePaymentToken: nft.last_sale?.payment_token?.symbol,
    lowResUrl: lowResUrl || null,
    marketplaceCollectionUrl: marketplace?.collection_url,
    marketplaceId: marketplace?.marketplace_id,
    marketplaceName: marketplace?.marketplace_name,
    name: nft.name || '',
    network: getNetworkFromSimpleHashChain(nft.chain),
    permalink: marketplace?.nft_url,
    // @ts-ignore TODO
    traits: nft.extra_metadata?.attributes ?? [],
    type: AssetType.nft,
    uniqueId: `${nft.contract_address}_${nft.token_id}`,
    urlSuffixForAsset: `${nft.contract_address}/${nft.token_id}`,
  };
}
