import { NFT_API_KEY, NFT_API_URL } from 'react-native-dotenv';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { Network } from '@/helpers';
import { SimpleHashListing, SimpleHashNFT, SimpleHashMarketplaceId } from '@/resources/nfts/simplehash/types';
import { getNetworkObj } from '@/networks';
import { UniqueAsset } from '@/entities';
import { RainbowError, logger } from '@/logger';
import { getGnosisNetworkObject } from '@/networks/gnosis';

export const START_CURSOR = 'start';

const nftApi = new RainbowFetchClient({
  baseURL: `https://${NFT_API_URL}/api/v0`,
});

const createCursorSuffix = (cursor: string) => (cursor === START_CURSOR ? '' : `&cursor=${cursor}`);

export async function fetchSimpleHashNFT(
  contractAddress: string,
  tokenId: string,
  network: Omit<Network, Network.goerli> = Network.mainnet
): Promise<SimpleHashNFT | undefined> {
  const chain = getNetworkObj(network as Network).nfts.simplehashNetwork;

  if (!chain) {
    logger.error(new RainbowError(`fetchSimpleHashNFT: no SimpleHash chain for network: ${network}`));
    return;
  }

  const response = await nftApi.get(`/nfts/${chain}/${contractAddress}/${tokenId}`, {
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
  network: Omit<Network, Network.goerli> = Network.mainnet
): Promise<SimpleHashListing | undefined> {
  // array of all eth listings on OpenSea for this token
  let listings: SimpleHashListing[] = [];
  let cursor = START_CURSOR;
  const chain = getNetworkObj(network as Network).nfts.simplehashNetwork;

  if (!chain) {
    logger.error(new RainbowError(`fetchSimpleHashNFTListing: no SimpleHash chain for network: ${network}`));
    return;
  }

  while (cursor) {
    const cursorSuffix = createCursorSuffix(cursor);
    // eslint-disable-next-line no-await-in-loop
    const response = await nftApi.get(
      // OpenSea ETH offers only for now
      `/nfts/listings/${chain}/${contractAddress}/${tokenId}?marketplaces=${SimpleHashMarketplaceId.OpenSea}${cursorSuffix}`,
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
  const chain = (nft.isPoap ? getGnosisNetworkObject() : getNetworkObj(nft.network)).nfts.simplehashNetwork;

  if (!chain) {
    logger.error(new RainbowError(`refreshNFTContractMetadata: no SimpleHash chain for network: ${nft.network}`));
    return;
  }

  try {
    await nftApi.post(
      `/nfts/refresh/${chain}/${nft.asset_contract.address}`,
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
      `refreshNFTContractMetadata: failed to refresh metadata for NFT contract ${nft.asset_contract.address}, falling back to refreshing NFT #${nft.id}`
    );
    try {
      // If the collection has > 20k NFTs, the above request will fail.
      // In that case, we need to refresh the given NFT individually.
      await nftApi.post(
        `/nfts/refresh/${chain}/${nft.asset_contract.address}/${nft.id}`,
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
          `refreshNFTContractMetadata: failed to refresh metadata for NFT #${nft.id} after failing to refresh metadata for NFT contract ${nft.asset_contract.address}`
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
  const chain = (nft.isPoap ? getGnosisNetworkObject() : getNetworkObj(nft.network)).nfts.simplehashNetwork;

  if (!chain) {
    logger.error(new RainbowError(`reportNFT: no SimpleHash chain for network: ${nft.network}`));
    return;
  }

  try {
    await nftApi.post(
      '/nfts/report/spam',
      {
        contract_address: nft.asset_contract.address,
        chain_id: chain,
        token_id: nft.id,
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
    logger.error(new RainbowError(`reportNFT: failed to report NFT ${nft.asset_contract.address} #${nft.id} as spam to SimpleHash`));
  }
}
