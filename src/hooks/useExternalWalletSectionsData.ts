import { useEffect, useMemo } from 'react';
import { AssetListType } from '../components/asset-list/RecyclerAssetList2';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import { buildBriefUniqueTokenList } from '@/helpers/assets';
import { useExternalNftCollectionsStore } from '@/state/nfts';
import { useExternalNftsStore, useExternalProfileStore } from '@/state/nfts/externalNfts';

type ExternalWalletSectionsDataProps = {
  address?: string;
  type?: AssetListType;
};

export function useExternalWalletSectionsData({ address, type }: ExternalWalletSectionsDataProps) {
  const { data: hiddenTokens } = useFetchHiddenTokens({ address });
  const { data: showcaseTokens } = useFetchShowcaseTokens({ address });

  const externalProfile = useExternalProfileStore(s => s.externalProfile);
  const setExternalProfile = useExternalProfileStore(s => s.setExternalProfile);

  const isInitialLoading = useExternalNftCollectionsStore(s => s.getStatus().isInitialLoading);
  const uniqueTokenFamilies = useExternalNftCollectionsStore(s => s.getCollections());

  const uniqueTokens = useExternalNftsStore(s => s.getNfts());
  const sellingTokens = useExternalNftsStore(s => s.getNftsForSale());

  const briefSectionsData = useMemo(
    () =>
      uniqueTokens && uniqueTokenFamilies
        ? buildBriefUniqueTokenList(uniqueTokens, uniqueTokenFamilies, showcaseTokens, sellingTokens, hiddenTokens, type)
        : [],
    [uniqueTokens, uniqueTokenFamilies, showcaseTokens, sellingTokens, hiddenTokens, type]
  );

  useEffect(() => {
    if (address && externalProfile !== address) {
      setExternalProfile(address);
    }
  }, [address, externalProfile, setExternalProfile]);

  return {
    briefSectionsData,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
