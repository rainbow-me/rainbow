import { groupBy } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

const uniqueTokensSelector = (state: any) => state.uniqueTokens.uniqueTokens;

const sendableUniqueTokens = (uniqueTokens: any) => {
  const sendableUniqueTokens = uniqueTokens?.filter(
    (uniqueToken: any) => uniqueToken.isSendable
  );
  const grouped = groupBy(sendableUniqueTokens, token => token.familyName);
  const families = Object.keys(grouped).sort();
  let sendableTokens = [];
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
};

const sendableUniqueTokensSelector = createSelector(
  [uniqueTokensSelector],
  sendableUniqueTokens
);

export default function useSendableUniqueTokens() {
  return useSelector(sendableUniqueTokensSelector);
}
