import { captureException } from '@sentry/react-native';
import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';

import { RainbowFetchClient } from '@/rainbow-fetch';
import { Network } from '@/helpers';
import { logger, RainbowError } from '@/logger';

import { getSimplehashChainFromNetwork } from '@/resources/nfts/simplehash/utils';
import {
  SimplehashChain,
  SimplehashListing,
  SimplehashNft,
  SimplehashPaymentTokenId,
  SimplehashMarketplaceId,
} from '@/resources/nfts/simplehash/types';

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

const START_CURSOR = 'start';

const simplehashApi = new RainbowFetchClient({
  baseURL: 'https://api.simplehash.com/api',
});

const createCursorSuffix = (cursor: string) =>
  cursor === START_CURSOR ? '' : `&cursor=${cursor}`;

export async function fetchSimplehashNft(
  contractAddress: string,
  tokenId: string,
  network: Omit<Network, Network.goerli> = Network.mainnet
): Promise<SimplehashNft | undefined> {
  const chain = getSimplehashChainFromNetwork(network);
  try {
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
    return response.data;
  } catch (error) {
    logger.error(
      new RainbowError(
        `Error fetching simplehash NFT (chain: ${chain}, contractAddress: ${contractAddress}, tokenId: ${tokenId}) - ${error}`
      )
    );
    captureException(error);
  }
}

export async function fetchSimplehashNfts(
  walletAddress: string,
  cursor: string = START_CURSOR
): Promise<{ rawNftData: SimplehashNft[]; nextCursor: string | null }> {
  let rawNftData: SimplehashNft[] = [];
  let nextCursor;
  try {
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
    nextCursor = response?.data?.next_cursor;
    if (response.data?.nfts?.length) {
      rawNftData = [...rawNftData, ...response.data.nfts];
    }
  } catch (error) {
    logger.error(
      new RainbowError(
        `Error fetching simplehash NFTs for wallet address: ${walletAddress} - ${error}`
      )
    );
    captureException(error);
  }
  return { rawNftData, nextCursor };
}

export async function fetchSimplehashNftListing(
  network: Network,
  contractAddress: string,
  tokenId: string
): Promise<SimplehashListing | undefined> {
  // array of all eth listings on opensea for this token
  let listings: SimplehashListing[] = [];
  let cursor = START_CURSOR;
  const chain = getSimplehashChainFromNetwork(network);
  try {
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
  } catch (error) {
    logger.error(
      new RainbowError(
        `Error fetching listing for simplehash nft: (chain: ${chain}, contractAddress: ${contractAddress}, tokenId: ${tokenId}) - ${error}`
      )
    );
    captureException(error);
  }
}
