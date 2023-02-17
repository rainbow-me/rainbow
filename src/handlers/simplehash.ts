import { captureException } from '@sentry/react-native';
import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';
import { rainbowFetch, RainbowFetchClient } from '../rainbow-fetch';

import { UniqueAsset } from '@/entities';
import { Network } from '@/helpers';
import { parseSimplehashNFTs } from '@/parsers';
import { queryClient } from '@/react-query/queryClient';
import { qs } from 'url-parse';
import { POAP_ADDRESS } from '@/parsers/uniqueTokens';
import { logger, RainbowError } from '@/logger';

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

export interface SimplehashNFT {
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

const simplehashApi = new RainbowFetchClient({
  baseURL: 'https://api.simplehash.com/api',
});

export async function getNFTByTokenId({
  chain = chains.ethereum,
  contractAddress,
  tokenId,
}: {
  chain?: SimpleHashChain;
  contractAddress: string;
  tokenId: string;
}) {
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

export async function fetchRawUniqueTokens(
  walletAddress: string,
  cursor: string | null | undefined = START_CURSOR
) {
  let rawNFTData: SimplehashNFT[] = [];
  let nextCursor;
  try {
    const chainsParam = `${chains.ethereum},${chains.arbitrum},${chains.optimism},${chains.polygon},${chains.bsc},${chains.gnosis}`;
    const response = await simplehashApi.get(`/v0/nfts/owners`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': SIMPLEHASH_API_KEY,
      },
      //@ts-ignore
      params: {
        chains: chainsParam,
        ...(cursor !== START_CURSOR && { cursor }),
        wallet_addresses: walletAddress,
      },
    });
    nextCursor = (qs.parse(response.data.next) as any)['cursor'];
    if (response.data?.nfts?.length) {
      rawNFTData = [...rawNFTData, ...response.data.nfts];
    }
  } catch (error) {
    logger.error(
      new RainbowError(
        `Error fetching simplehash NFTs for wallet address: ${walletAddress} - ${error}`
      )
    );
    captureException(error);
  }
  return { rawNFTData, nextCursor };
}
