import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { legacyBuildBriefUniqueTokenList } from '@/helpers/assets';
import { useLegacyNFTs } from '@/resources/nfts';

export default function useExternalWalletSectionsData({ address, type }: { address?: string; type?: AssetListType }) {
  const {
    data: { nfts: uniqueTokens },
    isInitialLoading,
  } = useLegacyNFTs({
    address: address ?? '',
  });
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  // TODO: Bring back selling tokens eventually
  // const sellingTokens = useMemo(() => uniqueTokens?.filter(token => token.) || [], [uniqueTokens]);

  const briefSectionsData = useMemo(
    () => (uniqueTokens ? legacyBuildBriefUniqueTokenList(uniqueTokens, showcaseTokens, [], hiddenTokens, type) : []),
    [uniqueTokens, showcaseTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
