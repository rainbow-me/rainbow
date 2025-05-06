import { groupBy } from 'lodash';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useLegacyNFTs } from '@/resources/nfts';
import { useNftSort } from './useNFTsSortBy';
import { useMemo } from 'react';

export default function useUniqueTokens() {
  const { nftSort, nftSortDirection } = useNftSort();
  const accountAddress = useAccountAddress();
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
