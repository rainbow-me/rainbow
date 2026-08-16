import type { UniqueAsset } from '@/entities/uniqueAssets';
import { isENSAddressFormat } from '@/features/address/core/domainFormat';
import { ENS_NFT_CONTRACT_ADDRESS } from '@/features/ens/references';
import { queryClient } from '@/react-query';
import { fetchNFTData, nftsQueryKey, type NFTData } from '@/resources/nfts';
import { parseUniqueId } from '@/resources/nfts/utils';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

export function isDataComplete(tokens: string[]) {
  if (!tokens.length) return true;

  for (const token of tokens) {
    const { network, contractAddress, tokenId } = parseUniqueId(token);
    if (!network || !contractAddress || !tokenId) return false;
  }
  return true;
}

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
    const isENS = isENSAddressFormat(token);
    if (isENS) {
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

export function mergeMaps<T>(map1: Map<string, T>, map2: Map<string, T>) {
  return new Map(
    (function* () {
      yield* map1;
      yield* map2;
    })()
  );
}
