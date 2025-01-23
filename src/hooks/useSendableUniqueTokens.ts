import { groupBy } from 'lodash';
import { useUserNftsStore } from '@/state/nfts';

export default function useSendableUniqueTokens() {
  const uniqueTokens = useUserNftsStore()(state => state.nfts) || [];
  const sendableUniqueTokens = uniqueTokens?.filter((uniqueToken: any) => uniqueToken.isSendable);
  const grouped = groupBy(sendableUniqueTokens, token => token.familyName);
  const families = Object.keys(grouped).sort();
  const sendableTokens = [];
  for (let i = 0; i < families.length; i++) {
    let newObject = {};
    newObject = {
      data: grouped[families[i]],
      familyId: i,
      familyImage: grouped[families[i]][0].familyImage,
      name: families[i],
    };
    sendableTokens.push(newObject);
  }
  return { sendableUniqueTokens: sendableTokens, uniqueTokens };
}
