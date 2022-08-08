import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import useFetchUniqueTokens from './useFetchUniqueTokens';
import { buildBriefUniqueTokenList } from '@rainbow-me/helpers/assets';

export default function useExternalWalletSectionsData({
  address,
  type,
}: {
  address?: string;
  type?: AssetListType;
}) {
  const {
    data: uniqueTokens,
    isLoading: isUniqueTokensLoading,
    isSuccess: isUniqueTokensSuccess,
  } = useFetchUniqueTokens({ address });
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
            [],
            type
          )
        : [],
    [uniqueTokens, showcaseTokens, sellingTokens, type]
  );

  return {
    briefSectionsData,
    isLoading: isUniqueTokensLoading,
    isSuccess: isUniqueTokensSuccess,
  };
}
