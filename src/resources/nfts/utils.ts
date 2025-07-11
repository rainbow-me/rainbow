import { UniqueAsset, AssetType } from '@/entities';
import { gretch } from 'gretchen';
import { paths } from '@reservoir0x/reservoir-sdk';
import { RainbowError, logger } from '@/logger';
import { handleSignificantDecimals } from '@/helpers/utilities';
import { IS_PROD } from '@/env';
import { RESERVOIR_API_KEY_DEV, RESERVOIR_API_KEY_PROD } from 'react-native-dotenv';
import { handleNFTImages } from '@/utils/handleNFTImages';
import { GetNftsByCollectionQuery } from '@/graphql/__generated__/arc';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { Address, isAddress } from 'viem';

const SUPPORTED_NETWORKS = [Network.mainnet, Network.polygon, Network.bsc, Network.arbitrum, Network.optimism, Network.base, Network.zora];

type ErrorResponse = {
  errors: {
    message: string;
  }[];
};

type SuccessResponse = paths['/collections/v6']['get']['responses']['200']['schema'];

export async function fetchReservoirNFTFloorPrice(nft: UniqueAsset): Promise<string | undefined> {
  if (SUPPORTED_NETWORKS.includes(nft.network)) {
    try {
      const res = await gretch<SuccessResponse, ErrorResponse>(
        `https://api${nft.network === Network.mainnet ? '' : `-${nft.network}`}.reservoir.tools/collections/v6?contract=${
          nft.contractAddress
        }`,
        {
          method: 'GET',
          headers: {
            'x-api-key': IS_PROD ? RESERVOIR_API_KEY_PROD : RESERVOIR_API_KEY_DEV,
          },
        }
      ).json();
      if (res?.data?.collections?.[0]?.floorAsk?.price?.amount?.decimal && res?.data?.collections?.[0]?.floorAsk?.price?.currency?.symbol) {
        const roundedDecimal = handleSignificantDecimals(
          res?.data?.collections?.[0]?.floorAsk?.price?.amount?.decimal,
          18,
          3,
          undefined,
          false
        );
        return `${roundedDecimal} ${res?.data?.collections?.[0]?.floorAsk?.price?.currency?.symbol}`;
      }
    } catch (e) {
      logger.error(new RainbowError(`[nfts]: Error fetching NFT floor price from Reservoir: ${e}`));
    }
  }
  return undefined;
}

export function parseUniqueId(uniqueId: string): {
  network?: Network;
  contractAddress: Address;
  tokenId: string;
} {
  const parts = uniqueId.split('_');
  if (parts.length === 2 && isAddress(parts[0])) {
    const [contractAddress, tokenId] = parts;
    return {
      contractAddress: contractAddress as Address,
      tokenId,
    };
  }
  const [network, contractAddress, tokenId] = parts;
  return {
    network: network as Network,
    contractAddress: contractAddress as Address,
    tokenId,
  };
}

function buildMarketplaceData(nft: GetNftsByCollectionQuery['nftsByCollection'][number]):
  | {
      marketplaceUrl: string;
      marketplaceName: string;
    }
  | undefined {
  // if we have it already, return it
  if (nft.marketplaceUrl && nft.marketplaceName) {
    return {
      marketplaceUrl: nft.marketplaceUrl,
      marketplaceName: nft.marketplaceName,
    };
  }

  const { network, contractAddress, tokenId } = parseUniqueId(nft.uniqueId);

  if (network && contractAddress && tokenId) {
    return {
      marketplaceUrl: `https://opensea.io/item/${network}/${contractAddress}/${tokenId}`,
      marketplaceName: 'OpenSea',
    };
  }
}

export function parseUniqueAsset(
  nft: GetNftsByCollectionQuery['nftsByCollection'][number],
  chainIds: Record<Network, ChainId>
): UniqueAsset {
  const { network = Network.mainnet, contractAddress, tokenId } = parseUniqueId(nft.uniqueId);

  const { highResUrl: imageUrl, lowResUrl } = handleNFTImages({
    originalUrl: nft.images.highResUrl,
    previewUrl: nft.images.lowResUrl,
    mimeType: nft.images.mimeType,
  });

  const marketplaceData = buildMarketplaceData(nft);

  return {
    ...nft,
    ...(marketplaceData ? { marketplaceUrl: marketplaceData.marketplaceUrl, marketplaceName: marketplaceData.marketplaceName } : {}),
    type: nft.type as AssetType,
    standard: nft.standard,
    images: {
      highResUrl: imageUrl,
      lowResUrl: lowResUrl,
      mimeType: nft.images.mimeType,
      animatedUrl: nft.images.animatedUrl,
      animatedMimeType: nft.images.animatedMimeType,
    },
    uniqueId: nft.uniqueId.toLowerCase() as `${Network}_${Address}_${number}`,
    tokenId,
    contractAddress,
    network,
    chainId: chainIds[network],
  };
}
