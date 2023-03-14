import { useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { useLegacyNFTs } from '@/resources/nfts';

export default function useExternalWalletSectionsData({
  address,
  type,
}: {
  address: string;
  type?: AssetListType;
}) {
  const { data: nfts, isFetching } = useLegacyNFTs({ address });
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const sellingTokens = useMemo(
    () => nfts?.filter(token => token.currentPrice) || [],
    [nfts]
  );

  const briefSectionsData = useMemo(
    () =>
      nfts
        ? buildBriefUniqueTokenList(
            nfts,
            showcaseTokens,
            sellingTokens,
            hiddenTokens,
            type
          )
        : [],
    [nfts, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  return {
    briefSectionsData,
    isSuccess: !isFetching || nfts.length,
  };
}
