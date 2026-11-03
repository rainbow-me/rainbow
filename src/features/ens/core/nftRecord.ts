import { getAddress, isAddressEqual } from 'viem';

import type { UniqueAsset } from '@/entities/uniqueAssets';

const NFT_RECORD = /^eip155:(\d+)\/(erc721|erc1155):(0x[\da-f]{40})\/(\d+|0x[\da-f]+)$/i;

/**
 * Identifies the NFT referenced by an ENS image record.
 */
export function parseNftRecord(value?: string) {
  const match = value && NFT_RECORD.exec(value);
  if (!match) return null;

  const standard: 'erc721' | 'erc1155' = match[2].toLowerCase() === 'erc721' ? 'erc721' : 'erc1155';
  return {
    chainId: Number(match[1]),
    standard,
    contractAddress: getAddress(match[3].toLowerCase()),
    tokenId: BigInt(match[4]),
  };
}

/**
 * Uses the selected NFT as the record when its standard defines metadata.
 * Other collectibles can still supply their image directly.
 */
export function nftImageRecord(asset: UniqueAsset): string | undefined {
  if (asset.standard === 'ERC721' || asset.standard === 'ERC1155') {
    return `eip155:${asset.chainId}/${asset.standard.toLowerCase()}:${asset.contractAddress}/${asset.tokenId}`;
  }
  return asset.images.highResUrl || asset.images.lowResUrl || undefined;
}

export function findRecordNft(nfts: UniqueAsset[] | undefined, record: ReturnType<typeof parseNftRecord>) {
  if (!record) return undefined;

  return nfts?.find(
    asset =>
      asset.chainId === record.chainId &&
      isAddressEqual(asset.contractAddress, record.contractAddress) &&
      asset.standard?.toLowerCase() === record.standard &&
      BigInt(asset.tokenId) === record.tokenId
  );
}
