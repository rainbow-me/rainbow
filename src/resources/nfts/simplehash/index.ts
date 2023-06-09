import { NFT_API_KEY, NFT_API_URL } from 'react-native-dotenv';
import { create } from 'gretchen';
import { Network } from '@/helpers';
import { getSimpleHashChainFromNetwork } from '@/resources/nfts/simplehash/utils';
import {
  SimpleHashChain,
  SimpleHashListing,
  SimpleHashNFT,
  SimpleHashMarketplaceId,
} from '@/resources/nfts/simplehash/types';
import { RainbowNetworks } from '@/networks';
import { UniqueAsset } from '@/entities';
import { RainbowError, logger } from '@/logger';

export const START_CURSOR = 'start';

const nftApi = create({
  baseURL: `https://${NFT_API_URL}/api/v0`,
});

const createCursorSuffix = (cursor: string) =>
  cursor === START_CURSOR ? '' : `&cursor=${cursor}`;

export async function fetchSimpleHashNFT(
  contractAddress: string,
  tokenId: string,
  network: Omit<Network, Network.goerli> = Network.mainnet
): Promise<SimpleHashNFT | undefined> {
  const chain = getSimpleHashChainFromNetwork(network);

  if (!chain) {
    throw new Error(
      `fetchSimpleHashNFT: no SimpleHash chain for network: ${network}`
    );
  }

  const response = await nftApi<SimpleHashNFT>(
    `/nfts/${chain}/${contractAddress}/${tokenId}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': NFT_API_KEY,
      },
    }
  ).json();

  return response.data;
}

export async function fetchSimpleHashNFTs(
  walletAddress: string,
  cursor: string = START_CURSOR
): Promise<{ data: SimpleHashNFT[]; nextCursor: string | null }> {
  const chainsParam = RainbowNetworks.filter(network => network.features.nfts)
    .map(network => network.nfts?.simplehashNetwork || network.value)
    .join(',');
  const cursorSuffix = createCursorSuffix(cursor);
  const response = await nftApi(
    `/nfts/owners?chains=${chainsParam}&wallet_addresses=${walletAddress}${cursorSuffix}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': NFT_API_KEY,
      },
    }
  ).json();
  return {
    data: response?.data?.nfts ?? [],
    nextCursor: response?.data?.next_cursor,
  };
}

export async function fetchSimpleHashNFTListing(
  contractAddress: string,
  tokenId: string,
  network: Omit<Network, Network.goerli> = Network.mainnet
): Promise<SimpleHashListing | undefined> {
  // array of all eth listings on OpenSea for this token
  let listings: SimpleHashListing[] = [];
  let cursor = START_CURSOR;
  const chain = getSimpleHashChainFromNetwork(network);

  while (cursor) {
    const cursorSuffix = createCursorSuffix(cursor);
    // eslint-disable-next-line no-await-in-loop
    const response = await nftApi(
      // OpenSea ETH offers only for now
      `/nfts/listings/${chain}/${contractAddress}/${tokenId}?marketplaces=${SimpleHashMarketplaceId.OpenSea}${cursorSuffix}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': NFT_API_KEY,
        },
      }
    ).json();
    cursor = response?.data?.next_cursor;
    // aggregate array of eth listings on OpenSea
    listings = [
      ...listings,
      response?.data?.listings?.find(
        (listing: SimpleHashListing) =>
          listing?.payment_token?.payment_token_id === 'ethereum.native'
      ),
    ];
  }
  // cheapest eth listing
  const cheapestListing = listings.reduce((prev, curr) =>
    curr.price < prev.price ? curr : prev
  );
  return cheapestListing;
}

/**
 * Given an NFT, refresh its contract metadata on SimpleHash. If we can't,
 * refresh metadata for this NFT only.
 * @param nft
 */
export async function refreshNFTContractMetadata(nft: UniqueAsset) {
  const chain = nft.isPoap
    ? SimpleHashChain.Gnosis
    : getSimpleHashChainFromNetwork(nft.network);

  if (!chain) {
    logger.error(
      new RainbowError(
        `refreshNFTContractMetadata: no SimpleHash chain for network: ${nft.network}`
      )
    );
  }

  try {
    await nftApi(`/nfts/refresh/${chain}/${nft.asset_contract.address}`, {
      method: 'POST',
      json: {},
      headers: {
        'x-api-key': NFT_API_KEY,
      },
    }).flush();
  } catch {
    logger.warn(
      `refreshNFTContractMetadata: failed to refresh metadata for NFT contract ${nft.asset_contract.address}, falling back to refreshing NFT #${nft.id}`
    );
    try {
      // If the collection has > 20k NFTs, the above request will fail.
      // In that case, we need to refresh the given NFT individually.
      await nftApi(
        `/nfts/refresh/${chain}/${nft.asset_contract.address}/${nft.id}`,
        {
          method: 'POST',
          json: {},
          headers: {
            'x-api-key': NFT_API_KEY,
          },
        }
      ).flush();
    } catch {
      logger.error(
        new RainbowError(
          `refreshNFTContractMetadata: failed to refresh metadata for NFT #${nft.id} after failing to refresh metadata for NFT contract ${nft.asset_contract.address}`
        )
      );
    }
  }
}
