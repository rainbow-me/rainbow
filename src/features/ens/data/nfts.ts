import { AssetType } from '@/entities/assetTypes';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { ChainId } from '@/features/network/types/backendNetworks';
import { ensClient } from '@/graphql';
import { logger } from '@/logger';

import { ensContracts } from '../core/contracts';

const ENS_COLLECTIONS: ReadonlySet<string> = new Set([ensContracts.legacyRegistrar, ensContracts.nameWrapper, ensContracts.ethRegistry]);

/**
 * Classifies freshly fetched NFTs before publication. Native registry indexing
 * identifies subname collections without maintaining a contract allowlist.
 */
export async function identifyEnsNfts(nfts: UniqueAsset[]): Promise<void> {
  const registries = new Set<string>();
  for (const nft of nfts) {
    if (nft.chainId !== ChainId.mainnet) continue;
    if (ENS_COLLECTIONS.has(nft.contractAddress.toLowerCase())) nft.type = AssetType.ens;
    else if (nft.standard === 'ERC1155') registries.add(nft.contractAddress.toLowerCase());
  }
  if (!registries.size) return;
  try {
    const result = await ensClient.getEnsRegistries({ addresses: [...registries], first: registries.size });
    const ensRegistries = new Set(result.ensv2Registries.map(registry => registry.id));
    for (const nft of nfts) {
      if (nft.chainId === ChainId.mainnet && ensRegistries.has(nft.contractAddress.toLowerCase())) nft.type = AssetType.ens;
    }
  } catch (error) {
    // Classification is optional metadata; an index outage must not hide owned NFTs.
    logger.warn('[ENS] Unable to identify subname collections', { error });
  }
}
