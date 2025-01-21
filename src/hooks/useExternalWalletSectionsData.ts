import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { useNftsStore } from '@/state/nfts';

export default function useExternalWalletSectionsData({ address, type }: { address?: string; type?: AssetListType }) {
  const nftsStore = useNftsStore(address ?? '');
  const nftsStatus = nftsStore(state => state.status);
  const uniqueTokens = nftsStore(state => state.getData()?.nfts || []);
  const isInitialLoading = nftsStatus === 'loading' && uniqueTokens.length === 0;
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const sellingTokens = useMemo(() => uniqueTokens?.filter(token => token.currentPrice) || [], [uniqueTokens]);

  const briefSectionsData = useMemo(
    () => (uniqueTokens ? buildBriefUniqueTokenList(uniqueTokens, showcaseTokens, sellingTokens, hiddenTokens, type) : []),
    [uniqueTokens, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
