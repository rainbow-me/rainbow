import { useMemo } from 'react';

import { buildProfileNftRows } from '@/features/ens/data/buildProfileNftRows';
import useHiddenTokens from '@/hooks/useHiddenTokens';
import useShowcaseTokens from '@/hooks/useShowcaseTokens';
import { useLegacyNFTs } from '@/resources/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';

/**
 * Prepares visible profile NFTs from the existing query and saved preferences.
 */
export default function useExternalWalletSectionsData({ address }: { address?: string }): {
  briefSectionsData: ReturnType<typeof buildProfileNftRows>;
  isLoading: boolean;
  isSuccess: boolean;
} {
  const {
    data: { nfts: uniqueTokens },
    isInitialLoading,
  } = useLegacyNFTs({
    address: address ?? '',
  });
  const { hiddenTokens } = useHiddenTokens(address);
  const { showcaseTokens } = useShowcaseTokens(address);
  const openCollections = useOpenCollectionsStore(s => s.openCollections);

  const briefSectionsData = useMemo(
    () => (uniqueTokens ? buildProfileNftRows(uniqueTokens, showcaseTokens ?? [], hiddenTokens ?? [], openCollections) : []),
    [uniqueTokens, showcaseTokens, hiddenTokens, openCollections]
  );

  return {
    briefSectionsData,
    isLoading: isInitialLoading,
    isSuccess: !isInitialLoading,
  };
}
