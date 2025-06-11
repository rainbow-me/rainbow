import { useCallback } from 'react';
import { queryClient } from '@/react-query';
import { fetchNFTData, NFTData, nftsQueryKey } from '@/resources/nfts';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { isENSAddressFormat } from '@/helpers/validators';
import { UniqueAsset } from '@/entities';
import { ENS_NFT_CONTRACT_ADDRESS } from '@/references';
import { isLowerCaseMatch } from '@/utils';
import { parseUniqueId } from '@/resources/nfts/utils';
import useShowcaseTokens from './useShowcaseTokens';
import useHiddenTokens from './useHiddenTokens';
import { useDispatch } from 'react-redux';
import { setShowcaseTokens } from '@/redux/showcaseTokens';
import { setHiddenTokens } from '@/redux/hiddenTokens';
import useWebData from './useWebData';
import useWallets from './useWallets';
import useAccountSettings from './useAccountSettings';

function matchEnsNameToUniqueId(ensName: string, nfts: UniqueAsset[]): UniqueAsset['uniqueId'] | undefined {
  for (const nft of nfts) {
    if (!isLowerCaseMatch(nft.contractAddress, ENS_NFT_CONTRACT_ADDRESS)) continue;

    if (!isLowerCaseMatch(nft.name, ensName)) continue;
    return nft.uniqueId;
  }

  return undefined;
}

function matchContractAndAddressAndTokenId(uniqueId: string, nfts: UniqueAsset[]): UniqueAsset['uniqueId'] | undefined {
  const { contractAddress, tokenId } = parseUniqueId(uniqueId);

  for (const nft of nfts) {
    if (!isLowerCaseMatch(nft.contractAddress, contractAddress) || !isLowerCaseMatch(nft.tokenId, tokenId)) continue;

    return nft.uniqueId;
  }

  return undefined;
}

function isDataComplete(tokens: string[]) {
  for (const token of tokens) {
    const { network, contractAddress, tokenId } = parseUniqueId(token);
    if (!network || !contractAddress || !tokenId) return false;
  }
  return true;
}

export default function useMigrateShowcaseAndHidden() {
  const dispatch = useDispatch();
  const { updateWebShowcase, updateWebHidden } = useWebData();
  const { isReadOnlyWallet } = useWallets();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const { accountAddress } = useAccountSettings();

  const migrateShowcaseAndHidden = useCallback(async () => {
    if (!showcaseTokens.length && !hiddenTokens.length) return;
    const hasMigratedShowcase = isDataComplete(showcaseTokens);
    const hasMigratedHidden = isDataComplete(hiddenTokens);

    console.log('🔄 [Migration] Starting migration process...');
    console.log('📊 [Migration] Current tokens:', { hasMigratedHidden, hasMigratedShowcase });

    if (hasMigratedShowcase && hasMigratedHidden) return;

    const queryKey = nftsQueryKey({
      address: accountAddress,
      sortBy: NftCollectionSortCriterion.MostRecent,
      sortDirection: SortDirection.Asc,
    });

    let data = queryClient.getQueryData<NFTData>(queryKey);
    if (!data) {
      data = await fetchNFTData({
        queryKey,
        meta: undefined,
      });
    }

    if (!data) return;

    const migratedShowcaseTokens: string[] = [];
    const migratedHiddenTokens: string[] = [];

    if (!hasMigratedShowcase) {
      // handle ENS name / <contractAddress>_<tokenId> --> <network>_<contractAddress>_<tokenId>
      for (const token of showcaseTokens) {
        const isENS = isENSAddressFormat(token);
        if (isENS) {
          const uniqueId = matchEnsNameToUniqueId(token, data.nfts);
          if (!uniqueId) {
            continue;
          }
          migratedShowcaseTokens.push(uniqueId.toLowerCase());
        } else {
          const uniqueId = matchContractAndAddressAndTokenId(token, data.nfts);
          if (!uniqueId) {
            continue;
          }

          migratedShowcaseTokens.push(uniqueId.toLowerCase());
        }
      }
    }

    if (!hasMigratedHidden) {
      for (const token of hiddenTokens) {
        if (isENSAddressFormat(token)) {
          const uniqueId = matchEnsNameToUniqueId(token, data.nfts);
          if (!uniqueId) {
            // effectively, we should remove this token since we can't migrate it
            continue;
          }

          migratedHiddenTokens.push(uniqueId.toLowerCase());
        } else {
          const { network, contractAddress, tokenId } = parseUniqueId(token);

          // if we already have everything we need, migrate it directly
          if (network && contractAddress && tokenId) {
            migratedHiddenTokens.push(token.toLowerCase());
          } else {
            const uniqueId = matchContractAndAddressAndTokenId(token, data.nfts);
            if (!uniqueId) {
              // effectively, we should remove this token since we can't migrate it
              continue;
            }

            migratedHiddenTokens.push(uniqueId.toLowerCase());
          }
        }
      }
    }

    console.log('🔄 [Migration] Migrating tokens:', { migratedShowcaseTokens, migratedHiddenTokens });

    await Promise.all([dispatch(setShowcaseTokens(migratedShowcaseTokens)), dispatch(setHiddenTokens(migratedHiddenTokens))]);

    console.log('🔄 [Migration] Migrating tokens to web:', { migratedShowcaseTokens, migratedHiddenTokens });
    console.log('🔄 [Migration] isReadOnlyWallet:', isReadOnlyWallet);
    if (!isReadOnlyWallet) {
      await Promise.all([updateWebShowcase(migratedShowcaseTokens), updateWebHidden(migratedHiddenTokens)]);
    }
  }, [showcaseTokens, hiddenTokens, accountAddress, dispatch, isReadOnlyWallet, updateWebShowcase, updateWebHidden]);

  return migrateShowcaseAndHidden;
}
