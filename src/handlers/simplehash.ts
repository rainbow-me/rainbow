import { captureException } from '@sentry/react-native';
import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';
import { RainbowFetchClient } from '../rainbow-fetch';
import { Network } from '@/helpers';
import { qs } from 'url-parse';
import { logger, RainbowError } from '@/logger';
import { getSimplehashChainFromNetwork } from '@/parsers/uniqueTokens';

interface SimplehashMarketplace {
  marketplace_id: string;
  marketplace_name: string;
  marketplace_collection_id: string;
  nft_url: string;
  collection_url: string;
  verified: boolean;
}

interface SimplehashCollection {
  collection_id: string;
  name: string;
  description: string;
  image_url: string | null;
  banner_image_url: string | null;
  external_url: string | null;
  twitter_username: string | null;
  discord_url: string | null;
  marketplace_pages: SimplehashMarketplace[];
  spam_score: number;
}

export interface SimplehashNft {
  nft_id: string;
  chain: Network;
  contract_address: string;
  token_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  model_url: string | null;
  previews: {
    image_small_url: string | null;
    image_medium_url: string | null;
    image_large_url: string | null;
    image_opengraph_url: string | null;
    blurhash: string | null;
  };
  background_color: string | null;
  external_url: string | null;
  created_date: string | null;
  status: string;
  token_count: number;
  owner_count: number;
  contract: {
    type: string;
    name: string;
    symbol: string;
  };
  collection: SimplehashCollection;
  extra_metadata: any | null;
}

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

const chains = {
  arbitrum: 'arbitrum',
  bsc: 'bsc',
  ethereum: 'ethereum',
  gnosis: 'gnosis',
  optimism: 'optimism',
  polygon: 'polygon',
} as const;

type SimpleHashChain = keyof typeof chains;

const START_CURSOR = 'start';
export const OPENSEA_MARKETPLACE_ID = 'opensea';
export const ETH_PAYMENT_TOKEN_ID = 'ethereum.native';

const simplehashApi = new RainbowFetchClient({
  baseURL: 'https://api.simplehash.com/api',
});

const createCursorSuffix = (cursor: string) =>
  cursor === START_CURSOR ? '' : `&cursor=${cursor}`;

export async function fetchSimplehashNft(
  contractAddress: string,
  tokenId: string,
  chain: SimpleHashChain = chains.ethereum
) {
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
) {
  let rawNftData: SimplehashNft[] = [];
  let nextCursor;
  try {
    const chainsParam = `${chains.ethereum},${chains.arbitrum},${chains.optimism},${chains.polygon},${chains.bsc},${chains.gnosis}`;
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
    nextCursor = (qs.parse(response.data.next) as any)['cursor'];
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
) {
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
        `/v0/nfts/listings/${chain}/${contractAddress}/${tokenId}?marketplaces=${OPENSEA_MARKETPLACE_ID}${cursorSuffix}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': SIMPLEHASH_API_KEY,
          },
        }
      );
      cursor = (qs.parse(response.data.next) as any)['cursor'];
      // aggregate array of eth listings on opensea
      listings = [
        ...listings,
        response?.data?.listings?.find(
          (listing: SimplehashListing) =>
            listing?.payment_token?.payment_token_id === ETH_PAYMENT_TOKEN_ID
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
