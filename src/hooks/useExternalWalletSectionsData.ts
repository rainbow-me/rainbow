import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { useUniqueTokensProfile } from '@/state/nfts';

export default function useExternalWalletSectionsData({ address, type }: { address?: string; type?: AssetListType }) {
  const { data: uniqueTokensProfile, loading: isInitialLoading } = useUniqueTokensProfile(address ?? '');
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const sellingTokens = useMemo(() => uniqueTokensProfile?.filter(token => token.currentPrice) || [], [uniqueTokensProfile]);

  const briefSectionsData = useMemo(
    () => (uniqueTokensProfile ? buildBriefUniqueTokenList(uniqueTokensProfile, showcaseTokens, sellingTokens, hiddenTokens, type) : []),
    [uniqueTokensProfile, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
