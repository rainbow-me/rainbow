import { useMemo } from 'react';
import useFetchUniqueTokens from './useFetchUniqueTokens';
import { buildBriefUniqueTokenList } from '@rainbow-me/helpers/assets';

export default function useExternalWalletSectionsData({
  address,
}: {
  address?: string;
}) {
  const { data: uniqueTokens, isFetched } = useFetchUniqueTokens({ address });

  const briefSectionsData = useMemo(
    () => (uniqueTokens ? buildBriefUniqueTokenList(uniqueTokens, []) : []),
    [uniqueTokens]
  );

  return {
    briefSectionsData,
    isFetched,
  };
}
