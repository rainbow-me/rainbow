import { useMemo } from 'react';
import { useSearchCurrencyLists } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';

export const useAssetsToBuySections = () => {
  const { results: searchAssetsToBuySections, loading } = useSearchCurrencyLists();
  return useMemo(() => {
    return {
      sections: searchAssetsToBuySections,
      loading,
    };
  }, [searchAssetsToBuySections, loading]);
};
