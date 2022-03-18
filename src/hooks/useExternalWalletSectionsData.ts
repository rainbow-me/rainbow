import { useMemo } from 'react';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import useFetchUniqueTokens from './useFetchUniqueTokens';
import { buildBriefUniqueTokenList } from '@rainbow-me/helpers/assets';

export default function useExternalWalletSectionsData({
  address,
}: {
  address?: string;
}) {
  const {
    data: uniqueTokens,
    isLoading: isUniqueTokensLoading,
  } = useFetchUniqueTokens({ address });
  const {
    data: showcaseTokens,
    isLoading: isShowcaseTokensLoading,
  } = useFetchShowcaseTokens({ address });

  const sellingTokens = useMemo(
    () => uniqueTokens?.filter(token => token.currentPrice) || [],
    [uniqueTokens]
  );

  const briefSectionsData = useMemo(
    () =>
      uniqueTokens && showcaseTokens
        ? buildBriefUniqueTokenList(uniqueTokens, showcaseTokens, sellingTokens)
        : [],
    [uniqueTokens, showcaseTokens, sellingTokens]
  );

  return {
    briefSectionsData,
    isLoading: isUniqueTokensLoading || isShowcaseTokensLoading,
  };
}
