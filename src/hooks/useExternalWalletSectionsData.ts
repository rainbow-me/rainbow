import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { useNftsStore } from '@/state/nfts/nfts';
import { UniqueAsset } from '@/entities';

export default function useExternalWalletSectionsData({ address, type }: { address?: string; type?: AssetListType }) {
  const { collections } = useNftsStore.getState(address);
  const status = useNftsStore.getState(address).status;
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const sellingTokens: UniqueAsset[] = [];
  // const sellingTokens = useMemo(() => uniqueTokens?.filter(token => token.currentPrice) || [], [uniqueTokens]);

  const briefSectionsData = useMemo(
    () =>
      collections ? buildBriefUniqueTokenList(Array.from(collections.values()), showcaseTokens, sellingTokens, hiddenTokens, type) : [],
    [collections, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    isLoading: status === 'loading',
    isSuccess: status !== 'loading',
  };
}
