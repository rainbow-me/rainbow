import { groupBy } from 'lodash';
import { useAccountSettings } from '.';
import { useNFTs } from '@/resources/nfts';

export default function useSendableUniqueTokens() {
  const { accountAddress } = useAccountSettings();
  const { data: uniqueTokens } = useNFTs({ address: accountAddress });

  const sendableUniqueTokens = uniqueTokens?.filter(
    (uniqueToken: any) => uniqueToken.isSendable
  );
  const grouped = groupBy(
    sendableUniqueTokens,
    token => token.collection?.name
  );
  const families = Object.keys(grouped).sort();
  let sendableTokens = [];
  for (let i = 0; i < families.length; i++) {
    let newObject = {};
    newObject = {
      data: grouped[families[i]],
      familyId: i,
      familyImage: grouped[families[i]][0]?.collection?.imageUrl,
      name: families[i],
    };
    sendableTokens.push(newObject);
  }
  return { sendableUniqueTokens: sendableTokens, uniqueTokens };
}
