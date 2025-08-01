import { NFT_API_KEY, NFT_API_URL } from 'react-native-dotenv';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { SimpleHashListing, SimpleHashNFT, SimpleHashMarketplaceId } from '@/resources/nfts/simplehash/types';
import { AssetType, UniqueAsset } from '@/entities';
import { RainbowError, logger } from '@/logger';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const START_CURSOR = 'start';

const nftApi = new RainbowFetchClient({
  baseURL: `https://${NFT_API_URL}/api/v0`,
});

const createCursorSuffix = (cursor: string) => (cursor === START_CURSOR ? '' : `&cursor=${cursor}`);

export async function fetchSimpleHashNFT(
  contractAddress: string,
  tokenId: string,
  chainId: Omit<ChainId, ChainId.goerli> = ChainId.mainnet
): Promise<SimpleHashNFT | undefined> {
  return undefined;
  const simplehashNetwork = useBackendNetworksStore.getState().getChainsSimplehashNetwork()[chainId as ChainId];

  if (!simplehashNetwork) {
    logger.warn(`[simplehash]: no SimpleHash for chainId: ${chainId}`);
    return;
  }

  const response = await nftApi.get(`/nfts/${simplehashNetwork}/${contractAddress}/${tokenId}`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': NFT_API_KEY,
    },
  });
  return response?.data;
}

export async function fetchSimpleHashNFTListing(
  contractAddress: string,
  tokenId: string,
  chainId: Omit<ChainId, ChainId.goerli> = ChainId.mainnet
): Promise<SimpleHashListing | undefined> {
  return undefined;
  // array of all eth listings on OpenSea for this token
  let listings: SimpleHashListing[] = [];
  let cursor = START_CURSOR;
  const simplehashNetwork = useBackendNetworksStore.getState().getChainsSimplehashNetwork()[chainId as ChainId];

  if (!simplehashNetwork) {
    logger.warn(`[simplehash]: no SimpleHash for chainId: ${chainId}`);
    return;
  }

  while (cursor) {
    const cursorSuffix = createCursorSuffix(cursor);
    const response = await nftApi.get(
      // OpenSea ETH offers only for now
      `/nfts/listings/${simplehashNetwork}/${contractAddress}/${tokenId}?marketplaces=${SimpleHashMarketplaceId.OpenSea}${cursorSuffix}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': NFT_API_KEY,
        },
      }
    );
    cursor = response?.data?.next_cursor;
    // aggregate array of eth listings on OpenSea
    listings = [
      ...listings,
      response?.data?.listings?.find((listing: SimpleHashListing) => listing?.payment_token?.payment_token_id === 'ethereum.native'),
    ];
  }
  // cheapest eth listing
  const cheapestListing = listings.reduce((prev, curr) => (curr.price < prev.price ? curr : prev));
  return cheapestListing;
}

/**
 * Given an NFT, refresh its contract metadata on SimpleHash. If we can't,
 * refresh metadata for this NFT only.
 * @param nft
 */
export async function refreshNFTContractMetadata(nft: UniqueAsset) {
  return;
  const simplehashNetwork = useBackendNetworksStore.getState().getChainsSimplehashNetwork()[
    nft.type === AssetType.poap ? ChainId.gnosis : nft.chainId
  ];

  if (!simplehashNetwork) {
    logger.warn(`[simplehash]: no SimpleHash for chainId: ${nft.chainId}`);
    return;
  }

  try {
    await nftApi.post(
      `/nfts/refresh/${simplehashNetwork}/${nft.contractAddress}`,
      {},
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': NFT_API_KEY,
        },
      }
    );
  } catch {
    logger.warn(
      `[simplehash]: failed to refresh metadata for NFT contract ${nft.contractAddress}, falling back to refreshing NFT #${nft.tokenId}`
    );
    try {
      // If the collection has > 20k NFTs, the above request will fail.
      // In that case, we need to refresh the given NFT individually.
      await nftApi.post(
        `/nfts/refresh/${simplehashNetwork}/${nft.contractAddress}/${nft.tokenId}`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': NFT_API_KEY,
          },
        }
      );
    } catch {
      logger.error(
        new RainbowError(
          `[simplehash]: failed to refresh metadata for NFT #${nft.tokenId} after failing to refresh metadata for NFT contract ${nft.contractAddress}`
        )
      );
    }
  }
}

/**
 * Report an nft as spam to SimpleHash
 * @param nft
 */
export async function reportNFT(nft: UniqueAsset) {
  return;
  const simplehashNetwork = useBackendNetworksStore.getState().getChainsSimplehashNetwork()[
    nft.type === AssetType.poap ? ChainId.gnosis : nft.chainId
  ];

  if (!simplehashNetwork) {
    logger.warn(`[simplehash]: no SimpleHash for chainId: ${nft.chainId}`);
    return;
  }

  try {
    await nftApi.post(
      '/nfts/report/spam',
      {
        contract_address: nft.contractAddress,
        chain_id: simplehashNetwork,
        token_id: nft.tokenId,
        event_type: 'mark_as_spam',
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': NFT_API_KEY,
        },
      }
    );
  } catch {
    logger.error(new RainbowError(`[simplehash]: failed to report NFT ${nft.contractAddress} #${nft.tokenId} as spam to SimpleHash`));
  }
}
