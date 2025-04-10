import { useEffect, useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { useExternalNftCollectionsStore, useExternalNftsStore, useExternalProfileStore } from '@/state/nfts';
import { UniqueAsset } from '@/entities';

export default function useExternalWalletSectionsData({ address, type }: { address?: string; type?: AssetListType }) {
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const externalProfile = useExternalProfileStore(s => s.externalProfile);
  const isInitialLoading = useExternalNftCollectionsStore(s => s.getStatus().isInitialLoading);
  const uniqueTokenFamilies = useExternalNftCollectionsStore(s => s.getCollections());
  const uniqueTokens = useExternalNftsStore(s => s.getNfts());

  const sellingTokens = useMemo(() => uniqueTokens?.filter((token: UniqueAsset) => token.currentPrice) || [], [uniqueTokens]);
  const briefSectionsData = useMemo(
    () =>
      uniqueTokens && uniqueTokenFamilies ? buildBriefUniqueTokenList(uniqueTokens, uniqueTokenFamilies, showcaseTokens, sellingTokens, hiddenTokens, type) : [],
    [uniqueTokens, uniqueTokenFamilies, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  useEffect(() => {
    if (address && externalProfile !== address) {
      useExternalProfileStore.getState().setExternalProfile(address);
    }
  }, [address, externalProfile]);

  return {
    briefSectionsData,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
