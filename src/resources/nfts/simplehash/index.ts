import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';

import { RainbowFetchClient } from '@/rainbow-fetch';
import { Network } from '@/helpers';

import { getSimplehashChainFromNetwork } from '@/resources/nfts/simplehash/utils';
import {
  SimplehashChain,
  SimplehashListing,
  SimplehashNFT,
  SimplehashPaymentTokenId,
  SimplehashMarketplaceId,
} from '@/resources/nfts/simplehash/types';

export const START_CURSOR = 'start';

const simplehashApi = new RainbowFetchClient({
  baseURL: 'https://api.simplehash.com/api',
});

const createCursorSuffix = (cursor: string) =>
  cursor === START_CURSOR ? '' : `&cursor=${cursor}`;

export async function fetchSimplehashNFT(
  contractAddress: string,
  tokenId: string,
  network: Omit<Network, Network.goerli> = Network.mainnet
): Promise<SimplehashNFT | undefined> {
  const chain = getSimplehashChainFromNetwork(network);

  if (!chain) {
    throw new Error(
      `fetchSimpleHashNFT: no Simplehash chain for network: ${network}`
    );
  }

  const response = await simplehashApi.get(
    `/v0/nfts/${chain}/${contractAddress}/${tokenId}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': SIMPLEHASH_API_KEY,
      },
    }
  );
  return response?.data;
}

export async function fetchSimplehashNFTs(
  walletAddress: string,
  cursor: string = START_CURSOR
): Promise<{ data: SimplehashNFT[]; nextCursor: string | null }> {
  const chainsParam = [
    SimplehashChain.Ethereum,
    SimplehashChain.Arbitrum,
    SimplehashChain.Optimism,
    SimplehashChain.Polygon,
    SimplehashChain.Bsc,
    SimplehashChain.Gnosis,
  ].join(',');
  const cursorSuffix = createCursorSuffix(cursor);
  const response = await simplehashApi.get(
    `/v0/nfts/owners?chains=${chainsParam}&wallet_addresses=${walletAddress}${cursorSuffix}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': SIMPLEHASH_API_KEY,
      },
    }
  );
  return {
    data: response?.data?.nfts ?? [],
    nextCursor: response?.data?.next_cursor,
  };
}

export async function fetchSimplehashNFTListing(
  network: Network,
  contractAddress: string,
  tokenId: string
): Promise<SimplehashListing | undefined> {
  // array of all eth listings on opensea for this token
  let listings: SimplehashListing[] = [];
  let cursor = START_CURSOR;
  const chain = getSimplehashChainFromNetwork(network);

  while (cursor) {
    const cursorSuffix = createCursorSuffix(cursor);
    // eslint-disable-next-line no-await-in-loop
    const response = await simplehashApi.get(
      // opensea ETH offers only for now
      `/v0/nfts/listings/${chain}/${contractAddress}/${tokenId}?marketplaces=${SimplehashMarketplaceId.Opensea}${cursorSuffix}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': SIMPLEHASH_API_KEY,
        },
      }
    );
    cursor = response?.data?.next_cursor;
    // aggregate array of eth listings on opensea
    listings = [
      ...listings,
      response?.data?.listings?.find(
        (listing: SimplehashListing) =>
          listing?.payment_token?.payment_token_id ===
          SimplehashPaymentTokenId.Ethereum
      ),
    ];
  }
  // cheapest eth listing
  const cheapestListing = listings.reduce((prev, curr) =>
    curr.price < prev.price ? curr : prev
  );
  return cheapestListing;
}
