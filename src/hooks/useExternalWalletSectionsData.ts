import { useMemo } from 'react';

import { legacyBuildBriefUniqueTokenList } from '@/helpers/assets';
import useHiddenTokens from '@/hooks/useHiddenTokens';
import useShowcaseTokens from '@/hooks/useShowcaseTokens';
import { useLegacyNFTs } from '@/resources/nfts';

import { type AssetListType } from '../components/asset-list/RecyclerAssetList2';

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
