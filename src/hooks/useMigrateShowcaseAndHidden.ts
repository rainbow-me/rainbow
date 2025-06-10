import { useCallback, useEffect } from 'react';
import { useNftsStore } from '@/state/nfts/nfts';
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
import useAccountSettings from './useAccountSettings';
import { useDispatch } from 'react-redux';
import { setShowcaseTokens } from '@/redux/showcaseTokens';
import { setHiddenTokens } from '@/redux/hiddenTokens';
import useWebData from './useWebData';

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

export default function useMigrateShowcaseAndHidden() {
  const dispatch = useDispatch();
  const { updateWebShowcase, updateWebHidden } = useWebData();
  const { accountAddress } = useAccountSettings();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();

  const hasMigratedShowcase = useNftsStore(state => state.hasMigratedShowcase);
  const hasMigratedHidden = useNftsStore(state => state.hasMigratedHidden);

  const migrateShowcaseAndHidden = useCallback(async () => {
    if (!showcaseTokens.length && !hiddenTokens.length) return;
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
            // effectively, we should remove this token since we can't migrate it
            continue;
          }
          migratedShowcaseTokens.push(uniqueId);
        } else {
          const uniqueId = matchContractAndAddressAndTokenId(token, data.nfts);
          if (!uniqueId) {
            // effectively, we should remove this token since we can't migrate it
            continue;
          }

          migratedShowcaseTokens.push(uniqueId);
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

          migratedHiddenTokens.push(uniqueId);
        } else {
          const { network, contractAddress, tokenId } = parseUniqueId(token);

          // if we already have everything we need, migrate it directly
          if (network && contractAddress && tokenId) {
            migratedHiddenTokens.push(token);
          } else {
            const uniqueId = matchContractAndAddressAndTokenId(token, data.nfts);
            if (!uniqueId) {
              // effectively, we should remove this token since we can't migrate it
              continue;
            }

            migratedHiddenTokens.push(uniqueId);
          }
        }
      }
    }

    await Promise.all([
      dispatch(setShowcaseTokens(migratedShowcaseTokens)),
      dispatch(setHiddenTokens(migratedHiddenTokens)),
      updateWebShowcase(migratedShowcaseTokens),
      updateWebHidden(migratedHiddenTokens),
    ]);

    useNftsStore.setState({ hasMigratedShowcase: true, hasMigratedHidden: true });
  }, [showcaseTokens, hiddenTokens, hasMigratedShowcase, hasMigratedHidden, accountAddress, dispatch, updateWebShowcase, updateWebHidden]);

  useEffect(() => {
    migrateShowcaseAndHidden();
  }, [migrateShowcaseAndHidden]);
}
