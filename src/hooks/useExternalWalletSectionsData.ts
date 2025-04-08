import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { externalNftsStore, useExternalNftCollectionsStore } from '@/state/nfts';
import { UniqueAsset } from '@/entities';

export default function useExternalWalletSectionsData({ address, type }: { address?: string; type?: AssetListType }) {
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const isInitialLoading = useExternalNftCollectionsStore(s => s.getStatus().isInitialLoading);
  const uniqueTokenFamilies = useExternalNftCollectionsStore(s => s.getCollections(address ?? '') || []);
  const uniqueTokens = externalNftsStore(s => s.getNfts(address ?? ''));

  const sellingTokens = useMemo(() => uniqueTokens?.filter((token: UniqueAsset) => token.currentPrice) || [], [uniqueTokens]);
  const briefSectionsData = useMemo(
    () =>
      uniqueTokens ? buildBriefUniqueTokenList(uniqueTokens, uniqueTokenFamilies, showcaseTokens, sellingTokens, hiddenTokens, type) : [],
    [uniqueTokens, uniqueTokenFamilies, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
