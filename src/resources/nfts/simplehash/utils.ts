import { AssetType } from '@/entities';
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
import { ERC1155, ERC721 } from '@/handlers/web3';

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

  const standard = nft.contract.type;

  return {
    animation_url: nft?.video_url ?? nft.extra_metadata?.animation_original_url,
    asset_contract: {
      address: nft.contract_address,
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
    isSendable:
      nft.chain === SimpleHashChain.Ethereum &&
      (standard === ERC1155 || standard === ERC721),
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
