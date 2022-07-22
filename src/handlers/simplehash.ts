import { captureException } from '@sentry/react-native';
// @ts-expect-error
import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';
import { RainbowFetchClient } from '../rainbow-fetch';
import { parseSimplehashNfts } from '@rainbow-me/parsers';
import { logger } from '@rainbow-me/utils';

interface SimplehashMarketplace {
  marketplace_name: string;
  marketplace_collection_id: string;
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
}

interface SimplehashNft {
  nft_id: string;
  chain: string;
  contract_address: string;
  token_id: string;
  name: string | null;
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
  extra_metadata: Record<string, string> | null;
}

const chains = {
  arbitrum: 'arbitrum',
  ethereum: 'ethereum',
  optimism: 'optimism',
  polygon: 'polygon',
} as const;
type SimpleHashChain = keyof typeof chains;

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
    logger.sentry(`Error fetching simplehash NFT: ${error}`);
    captureException(error);
  }
}

export async function getNftsByWalletAddress(walletAddress: string) {
  try {
    const chainParam: string = `${chains.arbitrum},${chains.optimism}`;
    const response = await simplehashApi.get(`/v0/nfts/owners`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': SIMPLEHASH_API_KEY,
      },
      params: {
        chains: chainParam,
        wallet_addresses: walletAddress,
      },
    });
    return parseSimplehashNfts(response.data.nfts);
  } catch (error) {
    logger.sentry(
      `Error fetching simplehash NFTs for wallet address: ${walletAddress} - ${error}`
    );
    captureException(error);
  }
}
