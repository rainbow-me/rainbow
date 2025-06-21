import { useCallback } from 'react';
import { queryClient } from '@/react-query';
import { fetchNFTData, NFTData, nftsQueryKey } from '@/resources/nfts';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { isENSAddressFormat } from '@/helpers/validators';
import { UniqueAsset } from '@/entities';
import { ENS_NFT_CONTRACT_ADDRESS } from '@/references';
import { isLowerCaseMatch } from '@/utils';
import { parseUniqueId } from '@/resources/nfts/utils';
import useWebData from './useWebData';
import { logger } from '@/logger';
import { useAccountAddress, useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import useOpenFamilies from '@/hooks/useOpenFamilies';
import { hiddenTokensQueryKey } from '@/hooks/useFetchHiddenTokens';
import { showcaseTokensQueryKey } from '@/hooks/useFetchShowcaseTokens';

function matchEnsNameToUniqueId(ensName: string, nfts: UniqueAsset[]): UniqueAsset['uniqueId'] | undefined {
  for (const nft of nfts) {
    if (!isLowerCaseMatch(nft.contractAddress, ENS_NFT_CONTRACT_ADDRESS)) continue;

    if (!isLowerCaseMatch(nft.name, ensName)) continue;
    return nft.uniqueId;
  }

  return undefined;
}

function matchContractAndAddress(uniqueId: string, nfts: UniqueAsset[]): UniqueAsset['uniqueId'] | undefined {
  const { contractAddress, tokenId } = parseUniqueId(uniqueId);

  for (const nft of nfts) {
    if (!isLowerCaseMatch(nft.contractAddress, contractAddress)) continue;

    return `${nft.network}_${contractAddress}_${Number(tokenId)}`;
  }

  return undefined;
}

export function isDataComplete(tokens: string[]) {
  for (const token of tokens) {
    const { network, contractAddress, tokenId } = parseUniqueId(token);
    if (!network || !contractAddress || !tokenId) return false;
  }
  return true;
}

export default function useMigrateShowcaseAndHidden() {
  const { updateWebShowcase, updateWebHidden, showcaseTokens, hiddenTokens } = useWebData();
  const { updateOpenFamilies } = useOpenFamilies();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const accountAddress = useAccountAddress();

  const migrateShowcaseAndHidden = useCallback(async () => {
    if (isReadOnlyWallet || (!showcaseTokens.length && !hiddenTokens.length)) {
      logger.debug('🔄 [Migration] Skipping showcase and hidden migration process...');
      return;
    }

    const hasMigratedShowcase = isDataComplete(showcaseTokens);
    const hasMigratedHidden = isDataComplete(hiddenTokens);

    if (hasMigratedShowcase && hasMigratedHidden) {
      logger.debug('🔄 [Migration] Showcase and hidden tokens have already been migrated...');
      return;
    }

    logger.debug('🔄 [Migration] Starting showcase and hidden migration process...');
    updateOpenFamilies({ Showcase: false });

    const queryKey = nftsQueryKey({
      address: accountAddress,
      sortBy: NftCollectionSortCriterion.MostRecent,
      sortDirection: SortDirection.Asc,
    });

    let data = queryClient.getQueryData<NFTData>(queryKey);
    logger.debug(`🔄 [Migration] Has cached query data: ${!!data}`);
    if (!data) {
      data = await fetchNFTData({
        queryKey,
        meta: undefined,
      });
    }

    logger.debug(`🔄 [Migration] Query data has NFTs: ${data.nfts.length}`);
    if (!data?.nfts?.length) return;

    const migratedShowcaseTokens: string[] = [];
    const migratedHiddenTokens: string[] = [];

    if (!hasMigratedShowcase) {
      logger.debug('🔄 [Migration] Migrating showcase tokens...');
      // handle ENS name / <contractAddress>_<tokenId> --> <network>_<contractAddress>_<tokenId>
      for (const token of showcaseTokens) {
        const isENS = isENSAddressFormat(token);
        if (isENS) {
          logger.debug(`🔄 [Migration] Migrating ENS name: ${token}`);
          const uniqueId = matchEnsNameToUniqueId(token, data.nfts);
          if (!uniqueId) {
            logger.debug(`🔄 [Migration] No match found for ENS name: ${token}`);
            continue;
          }

          logger.debug(`🔄 [Migration] Migrating ENS name to uniqueId: ${uniqueId}`);
          migratedShowcaseTokens.push(uniqueId.toLowerCase());
        } else {
          logger.debug(`🔄 [Migration] Migrating contractAddress and tokenId: ${token}`);
          const uniqueId = matchContractAndAddress(token, data.nfts);
          if (!uniqueId) {
            logger.debug(`🔄 [Migration] No match found for token: ${token}`);
            continue;
          }

          logger.debug(`🔄 [Migration] Migrating token ${token} to uniqueId: ${uniqueId}`);
          migratedShowcaseTokens.push(uniqueId.toLowerCase());
        }
      }
    }

    if (!hasMigratedHidden) {
      logger.debug('🔄 [Migration] Migrating hidden tokens...');
      for (const token of hiddenTokens) {
        if (isENSAddressFormat(token)) {
          logger.debug(`🔄 [Migration] Migrating ENS name: ${token}`);
          const uniqueId = matchEnsNameToUniqueId(token, data.nfts);
          if (!uniqueId) {
            logger.debug(`🔄 [Migration] No match found for ENS name: ${token}`);
            continue;
          }

          logger.debug(`🔄 [Migration] Migrating ENS name to uniqueId: ${uniqueId}`);
          migratedHiddenTokens.push(uniqueId.toLowerCase());
        } else {
          logger.debug(`🔄 [Migration] Migrating contractAddress and tokenId: ${token}`);
          const { network, contractAddress, tokenId } = parseUniqueId(token);

          if (network && contractAddress && tokenId) {
            logger.debug(`🔄 [Migration] Migrating token ${token} to uniqueId: ${token}`);
            migratedHiddenTokens.push(token.toLowerCase());
          } else {
            const uniqueId = matchContractAndAddress(token, data.nfts);
            if (!uniqueId) {
              logger.debug(`🔄 [Migration] No match found for token: ${token}`);
              continue;
            }

            logger.debug(`🔄 [Migration] Migrating token ${token} to uniqueId: ${uniqueId}`);
            migratedHiddenTokens.push(uniqueId.toLowerCase());
          }
        }
      }
    }

    await Promise.all([
      updateWebShowcase(accountAddress, migratedShowcaseTokens),
      updateWebHidden(accountAddress, migratedHiddenTokens),
      queryClient.invalidateQueries({ queryKey: showcaseTokensQueryKey({ address: accountAddress }) }),
      queryClient.invalidateQueries({ queryKey: hiddenTokensQueryKey({ address: accountAddress }) }),
    ]).finally(() => {
      updateOpenFamilies({ Showcase: true });
    });
  }, [isReadOnlyWallet, showcaseTokens, hiddenTokens, updateOpenFamilies, accountAddress, updateWebShowcase, updateWebHidden]);

  return migrateShowcaseAndHidden;
}
