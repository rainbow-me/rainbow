import { useMemo } from 'react';
import { useSearchCurrencyLists } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';

export const useAssetsToBuySections = () => {
  const { results: searchAssetsToBuySections } = useSearchCurrencyLists();

  return useMemo(() => searchAssetsToBuySections, [searchAssetsToBuySections]);
};
