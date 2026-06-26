import { isAddress, type Address } from 'viem';

import { type AssetType } from '@/entities/assetTypes';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { Network, type ChainId } from '@/features/network/types/backendNetworks';
import { type GetNftsByCollectionQuery } from '@/graphql/__generated__/arc';
import { handleNFTImages } from '@/utils/handleNFTImages';

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
