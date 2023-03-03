import { groupBy } from 'lodash';
import useFetchUniqueTokens from './useFetchUniqueTokens';
import useAccountProfile from './useAccountProfile';

export default function useSendableUniqueTokens() {
  const { accountAddress } = useAccountProfile();
  const { data: uniqueTokens } = useFetchUniqueTokens({
    address: accountAddress,
    // Don't want to refetch tokens if we already have them.
    staleTime: Infinity,
  });

  const sendableUniqueTokens = uniqueTokens?.filter(token => token.isSendable);

  const grouped = groupBy(sendableUniqueTokens, token => token.collection.name);
  const families = Object.keys(grouped).sort();
  const sendableTokens = [];
  for (let i = 0; i < families.length; i++) {
    let newObject = {};
    newObject = {
      data: grouped[families[i]],
      familyId: i,
      familyImage: grouped[families[i]][0].collection.imageUrl,
      name: families[i],
    };
    sendableTokens.push(newObject);
  }
  return { sendableUniqueTokens: sendableTokens, uniqueTokens };
}
