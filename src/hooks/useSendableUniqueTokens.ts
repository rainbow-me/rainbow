import { groupBy } from 'lodash';
import { useAccountSettings } from '.';
import { useLegacyNFTs } from '@/resources/nfts';
import { useMemo } from 'react';

export default function useUniqueTokens() {
  const { accountAddress } = useAccountSettings();
  const {
    data: { nfts: uniqueTokens },
    isLoading: isFetchingNfts,
  } = useLegacyNFTs({
    address: accountAddress,
    config: {
      enabled: !!accountAddress,
    },
  });

  const sendableUniqueTokens = useMemo(() => {
    if (!uniqueTokens?.length) return [];

    const sendableTokens = uniqueTokens.filter(uniqueToken => uniqueToken.isSendable);
    const grouped = groupBy(sendableTokens, token => token.collectionName);
    const families = Object.keys(grouped).sort();

    return families.map((family, index) => ({
      data: grouped[family],
      familyId: index,
      familyImage: grouped[family][0].collectionImageUrl ?? null,
      name: family,
    }));
  }, [uniqueTokens]);

  return {
    sendableUniqueTokens,
    uniqueTokens,
    isFetchingNfts,
  };
}
