import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { useNFTs } from '@/resources/nfts';

export default function useExternalWalletSectionsData({
  address,
  type,
}: {
  address?: string;
  type?: AssetListType;
}) {
  const { data: uniqueTokens, isInitialLoading } = useNFTs({
    address: address ?? '',
  });
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const briefSectionsData = useMemo(
    () =>
      uniqueTokens
        ? buildBriefUniqueTokenList(
            uniqueTokens,
            showcaseTokens,
            // TODO: add selling tokens, when we have the data. not provided by simplehash, maybe reservoir?
            [],
            hiddenTokens,
            type
          )
        : [],
    [uniqueTokens, showcaseTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
