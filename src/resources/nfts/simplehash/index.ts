import { NFT_API_KEY, NFT_API_URL } from 'react-native-dotenv';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { Network } from '@/helpers';
import { getSimpleHashChainFromNetwork } from '@/resources/nfts/simplehash/utils';
import {
  SimpleHashChain,
  SimpleHashListing,
  SimpleHashNFT,
  SimpleHashMarketplaceId,
} from '@/resources/nfts/simplehash/types';

export const START_CURSOR = 'start';

const nftApi = new RainbowFetchClient({
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

  const response = await nftApi.get(
    `/nfts/${chain}/${contractAddress}/${tokenId}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': NFT_API_KEY,
      },
    }
  );
  return response?.data;
}

export async function fetchSimpleHashNFTs(
  walletAddress: string,
  cursor: string = START_CURSOR
): Promise<{ data: SimpleHashNFT[]; nextCursor: string | null }> {
  const chainsParam = [
    SimpleHashChain.Ethereum,
    SimpleHashChain.Arbitrum,
    SimpleHashChain.Optimism,
    SimpleHashChain.Polygon,
    SimpleHashChain.Bsc,
    SimpleHashChain.Gnosis,
  ].join(',');
  const cursorSuffix = createCursorSuffix(cursor);
  const response = await nftApi.get(
    `/nfts/owners?chains=${chainsParam}&wallet_addresses=${walletAddress}${cursorSuffix}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': NFT_API_KEY,
      },
    }
  );
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
