import type { UniqueAsset } from '@/entities/uniqueAssets';
import { ENS_NFT_CONTRACT_ADDRESS } from '@/features/ens/references';
import { parseUniqueId } from '@/features/nfts/core/uniqueId';
import { queryClient } from '@/react-query';
import { fetchNFTData, nftsQueryKey, type NFTData } from '@/resources/nfts';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

export function matchEnsNameToUniqueId(ensName: string, nfts: UniqueAsset[]): UniqueAsset['uniqueId'] | undefined {
  for (const nft of nfts) {
    if (!isLowerCaseMatch(nft.contractAddress, ENS_NFT_CONTRACT_ADDRESS) || !isLowerCaseMatch(nft.name, ensName)) continue;
    return nft.uniqueId;
  }

  return undefined;
}

export function matchContractAndAddress(uniqueId: string, nfts: UniqueAsset[]): string | undefined {
  const { contractAddress, tokenId } = parseUniqueId(uniqueId);

  for (const nft of nfts) {
    if (!isLowerCaseMatch(nft.contractAddress, contractAddress)) continue;
    return `${nft.network}_${contractAddress}_${tokenId}`;
  }

  return undefined;
}

export async function migrateTokens(accountAddress: string, tokens: string[]): Promise<string[] | null> {
  const migratedTokens: string[] = [];

  const queryKey = nftsQueryKey({
    address: accountAddress,
  });

  const data = await queryClient.fetchQuery<NFTData>({ queryKey, queryFn: () => fetchNFTData({ queryKey, meta: undefined }) });
  if (!data.nfts.length) return null;

  for (const token of tokens) {
    // Older NFT preferences stored .eth names instead of the registrar token's unique ID.
    if (token.toLowerCase().endsWith('.eth')) {
      const uniqueId = matchEnsNameToUniqueId(token, data.nfts);
      if (!uniqueId) {
        continue;
      }

      migratedTokens.push(uniqueId.toLowerCase());
    } else {
      const uniqueId = matchContractAndAddress(token, data.nfts);
      if (!uniqueId) {
        continue;
      }

      migratedTokens.push(uniqueId.toLowerCase());
    }
  }

  if (!migratedTokens.length) return null;

  return migratedTokens;
}

export function replaceEthereumWithMainnet(network: string | undefined): string | undefined {
  if (!network) return undefined;

  if (network === 'ethereum') {
    return 'mainnet';
  }
  return network;
}
