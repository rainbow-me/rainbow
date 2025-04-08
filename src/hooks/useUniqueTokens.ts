import { groupBy } from 'lodash';
import { UniqueAsset } from '@/entities';
import { useMemo } from 'react';
import { useUserNftCollectionsStore, useUserNftsStore } from '@/state/nfts';

type SendableUniqueToken = {
  data: UniqueAsset[];
  familyId: number;
  familyImage: string | null;
  name: string;
};

export default function useUniqueTokens() {
  const uniqueTokens = useUserNftsStore(s => s.getData()?.nfts);
  const sendableUniqueTokens: SendableUniqueToken[] = useMemo(() => {
    if (!uniqueTokens?.length) return [];

    const sendableTokens = uniqueTokens.filter(uniqueToken => uniqueToken.isSendable);
    const grouped = groupBy(sendableTokens, token => token.familyName);
    const families = Object.keys(grouped).sort();

    return families.map((family, index) => ({
      data: grouped[family],
      familyId: index,
      familyImage: grouped[family][0].familyImage ?? null,
      name: family,
    }));
  }, [uniqueTokens]);

  const uniqueTokenFamilies = useUserNftCollectionsStore(s => s.getCollections());
  const isInitialLoading = useUserNftCollectionsStore(s => s.getStatus().isInitialLoading);
  const isFetchingNfts = useUserNftCollectionsStore(s => s.getStatus().isFetching);

  return {
    sendableUniqueTokens,
    uniqueTokens,
    uniqueTokenFamilies,
    isFetchingNfts,
    isInitialLoading,
  };
}
