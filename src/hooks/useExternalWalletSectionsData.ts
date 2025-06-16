import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import { legacyBuildBriefUniqueTokenList } from '@/helpers/assets';
import { useLegacyNFTs } from '@/resources/nfts';
import useShowcaseTokens from '@/hooks/useShowcaseTokens';
import useHiddenTokens from '@/hooks/useHiddenTokens';

export default function useExternalWalletSectionsData({ address, type }: { address?: string; type?: AssetListType }) {
  const {
    data: { nfts: uniqueTokens },
    isInitialLoading,
  } = useLegacyNFTs({
    address: address ?? '',
  });
  const { hiddenTokens } = useHiddenTokens(address);
  const { showcaseTokens } = useShowcaseTokens(address);

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
