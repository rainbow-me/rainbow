import { isAddress } from 'ethers/lib/utils';
import { useCallback, useEffect, useState } from 'react';

import { fetchTokenSearch } from '@/resources/search/tokenSearch';
import { useFavoritesStore } from '@/state/favorites/favorites';
import { ParsedAsset } from '@/__swaps__/screens/Swap/types/assets';
import { ChainId } from '@/__swaps__/screens/Swap/types/chains';
import { SearchAsset } from '@/__swaps__/screens/Swap/types/search';

export type FavoriteAssets = Record<number, SearchAsset[]>;
const FAVORITES_EMPTY_STATE = {
  [ChainId.mainnet]: [],
  [ChainId.optimism]: [],
  [ChainId.bsc]: [],
  [ChainId.polygon]: [],
  [ChainId.arbitrum]: [],
  [ChainId.base]: [],
  [ChainId.zora]: [],
  [ChainId.avalanche]: [],
  [ChainId.hardhat]: [],
  [ChainId.hardhatOptimism]: [],
};

// expensive hook, only use in top level parent components
export function useFavoriteAssets() {
  const { favorites } = useFavoritesStore();
  const [favoritesData, setFavoritesData] = useState<FavoriteAssets>(FAVORITES_EMPTY_STATE);

  const setFavoriteAssetsData = useCallback(async () => {
    const chainIds = Object.keys(favorites)
      .filter(k => favorites?.[parseInt(k)])
      .map(c => +c);
    const searches: Promise<void>[] = [];
    const newSearchData = {} as Record<ChainId, SearchAsset[]>;
    for (const chain of chainIds) {
      const addressesByChain = favorites[chain];
      addressesByChain?.forEach(address => {
        const searchAddress = async (add: string) => {
          const query = add.toLocaleLowerCase();
          const queryIsAddress = isAddress(query);
          const keys = (queryIsAddress ? ['address'] : ['name', 'symbol']) as (keyof ParsedAsset)[];
          const threshold = queryIsAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
          const results = await fetchTokenSearch({
            chainId: chain,
            keys,
            list: 'verifiedAssets',
            threshold,
            query,
          });

          const currentFavoritesData = newSearchData[chain] || [];
          if (results?.[0]) {
            newSearchData[chain] = [...currentFavoritesData, results[0]];
          } else {
            const unverifiedSearchResults = await fetchTokenSearch({
              chainId: chain,
              keys,
              list: 'highLiquidityAssets',
              threshold,
              query,
            });
            if (unverifiedSearchResults?.[0]) {
              // eslint-disable-next-line require-atomic-updates
              newSearchData[chain] = [...currentFavoritesData, unverifiedSearchResults[0]];
            }
          }
        };
        searches.push(searchAddress(address));
      });
    }
    await Promise.all(searches);
    setFavoritesData(newSearchData);
  }, [favorites]);

  useEffect(() => {
    setFavoriteAssetsData();
  }, [setFavoriteAssetsData]);

  return {
    favorites: favoritesData,
  };
}
