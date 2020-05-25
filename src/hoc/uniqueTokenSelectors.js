import { filter, groupBy } from 'lodash';
import { createSelector } from 'reselect';

export const uniqueTokensSelector = state => state.uniqueTokens.uniqueTokens;

const sendableUniqueTokens = uniqueTokens => {
  const sendableUniqueTokens = filter(uniqueTokens, ['isSendable', true]);
  const grouped = groupBy(
    sendableUniqueTokens,
    token => token.asset_contract.name
  );
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

export const sendableUniqueTokensSelector = createSelector(
  [uniqueTokensSelector],
  sendableUniqueTokens
);
