import { groupBy } from 'lodash';
import { useAccountSettings } from '.';
import { useLegacyNFTs } from '@/resources/nfts';
import { useNftSort } from './useNFTsSortBy';
import { UniqueAsset } from '@/entities';

type SendableUniqueToken = {
  data: UniqueAsset[];
  familyId: number;
  familyImage: string | null;
  name: string;
};

export default function useUniqueTokens() {
  const { nftSort, nftSortDirection } = useNftSort();
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

  const sendableUniqueTokens = uniqueTokens?.filter(uniqueToken => uniqueToken.isSendable);
  const grouped = groupBy(sendableUniqueTokens, token => token.familyName);
  const families = Object.keys(grouped).sort();
  const sendableTokens: SendableUniqueToken[] = [];
  for (let i = 0; i < families.length; i++) {
    const newObject: SendableUniqueToken = {
      data: grouped[families[i]],
      familyId: i,
      familyImage: grouped[families[i]][0].familyImage ?? null,
      name: families[i],
    };
    sendableTokens.push(newObject);
  }
  return { sendableUniqueTokens: sendableTokens, uniqueTokens, isFetchingNfts };
}
