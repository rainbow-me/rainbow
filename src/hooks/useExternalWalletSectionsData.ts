import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { useUniqueTokens } from './useUniqueTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';

export default function useExternalWalletSectionsData({
  address,
  infinite = false,
  type,
}: {
  address?: string;
  infinite?: boolean;
  type?: AssetListType;
}) {
  const { uniqueTokens, isLoading: isUniqueTokensLoading } = useUniqueTokens({
    address: address || '',
  });
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const sellingTokens = useMemo(
    () => uniqueTokens?.filter(token => token.currentPrice) || [],
    [uniqueTokens]
  );

  const briefSectionsData = useMemo(
    () =>
      uniqueTokens
        ? buildBriefUniqueTokenList(
            uniqueTokens,
            showcaseTokens,
            sellingTokens,
            hiddenTokens,
            type
          )
        : [],
    [uniqueTokens, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    isLoading: isUniqueTokensLoading,
    isSuccess: !!uniqueTokens?.length,
  };
}
