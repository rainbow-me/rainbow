import { groupBy } from 'lodash';
import { useAccountSettings } from '.';
import { useLegacyNFTs } from '@/resources/nfts';
import { useMemo } from 'react';
import { nftsStoreManager } from '@/state/nfts/nftsStoreManager';

export default function useUniqueTokens() {
  const nftSort = nftsStoreManager(state => state.sortBy);
  const nftSortDirection = nftsStoreManager(state => state.sortDirection);
  const { accountAddress } = useAccountSettings();
  const {
    data: { nfts: uniqueTokens },
    isLoading: isFetchingNfts,
  } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      enabled: !!accountAddress,
    },
  });

  const sendableUniqueTokens = useMemo(() => {
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

  return {
    sendableUniqueTokens,
    uniqueTokens,
    isFetchingNfts,
  };
}
