import { captureException } from '@sentry/react-native';
import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';
import { RainbowFetchClient, rainbowFetch } from '../rainbow-fetch';

import { Network } from '@/helpers';
import { parseSimplehashNfts } from '@/parsers';
import { queryClient } from '@/react-query/queryClient';

import { logger } from '@/utils';
import { EthereumAddress, UniqueAsset } from '@/entities';

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
    logger.sentry(`Error fetching simplehash NFT: ${error}`);
    captureException(error);
  }
}

export async function getNftsByWalletAddress(walletAddress: string) {
  let rawResponseNfts: SimplehashNft[] = [];
  try {
    const chainsParam = `${Network.arbitrum},${Network.optimism},${Network.polygon}`;

    let cursor = START_CURSOR;
    while (cursor) {
      const response = await simplehashApi.get(`/v0/nfts/owners`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': SIMPLEHASH_API_KEY,
        },
        params: {
          chains: chainsParam,
          ...(cursor !== START_CURSOR && { cursor }),
          wallet_addresses: walletAddress,
        },
      });
      cursor = response.data.next;
      if (response.data?.nfts?.length > 0) {
        rawResponseNfts = rawResponseNfts.concat(response.data.nfts);
      }
    }
  } catch (error) {
    logger.sentry(
      `Error fetching simplehash NFTs for wallet address: ${walletAddress} - ${error}`
    );
    captureException(error);
  }

  // TODO(jxom): migrate this to Async State RFC architecture once it's merged in.
  const polygonAllowlist = await queryClient.fetchQuery(
    ['polygon-allowlist'],
    async () => {
      const polygonAllowlistAddresses = (
        await rainbowFetch(
          'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
          { method: 'get' }
        )
      ).data.data.addresses;

      const polygonAllowlist: Record<EthereumAddress, boolean> = {};
      polygonAllowlistAddresses.forEach((address: EthereumAddress) => {
        polygonAllowlist[address] = true;
      });

      return polygonAllowlist;
    },
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );

  return parseSimplehashNfts(rawResponseNfts).filter(
    (token: UniqueAsset) =>
      token.network !== Network.polygon ||
      polygonAllowlist[token.asset_contract?.address?.toLowerCase() || '']
  );
}
