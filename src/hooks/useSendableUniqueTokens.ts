import { groupBy } from 'lodash';
import { UniqueAsset } from '@/entities';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';

export default function useSendableUniqueTokens() {
  const { accountAddress } = useAccountSettings();
  const { nfts } = useLegacyNFTs(accountAddress);

  const sendableNFTs = nfts?.filter((nft: UniqueAsset) => nft.isSendable);

  const grouped = groupBy(sendableNFTs, token => token.familyName);
  const families = Object.keys(grouped).sort();
  const sendableTokens = [];
  for (let i = 0; i < families.length; i++) {
    sendableTokens.push({
      data: grouped[families[i]],
      familyId: i,
      familyImage: grouped[families[i]][0].familyImage,
      name: families[i],
    });
  }
  return sendableTokens;
}
