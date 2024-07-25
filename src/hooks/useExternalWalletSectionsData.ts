import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { usePaginatedNFTs } from '@/resources/nfts';
import { CollectibleSortByOptions } from './useNFTsSortBy';

export default function useExternalWalletSectionsData({ address, type }: { address?: string; type?: AssetListType }) {
  const {
    data: nftPageData,
    fetchNextPage: fetchMoreNfts,
    hasNextPage: hasMoreNfts,
    isInitialLoading,
  } = usePaginatedNFTs({
    address: address ?? '',
    limit: 25,
  });

  const nfts = useMemo(() => nftPageData?.pages.flatMap(page => page.data) ?? [], [nftPageData]);

  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const sellingTokens = useMemo(() => nfts?.filter(token => token.currentPrice) || [], [nfts]);

  const briefSectionsData = useMemo(
    () =>
      nfts
        ? buildBriefUniqueTokenList(nfts, showcaseTokens, sellingTokens, hiddenTokens, type, true, CollectibleSortByOptions.MOST_RECENT)
        : [],
    [nfts, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    hasMoreNfts,
    fetchMoreNfts,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
