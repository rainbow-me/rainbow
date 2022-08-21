import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { UniqueAsset } from '@rainbow-me/entities';
import { groupBy } from '@rainbow-me/helpers/utilities';
import { AppState } from '@rainbow-me/redux/store';

const uniqueTokensSelector = (state: AppState) =>
  state.uniqueTokens.uniqueTokens;

const sendableUniqueTokens = (uniqueTokens: UniqueAsset[]) => {
  const sendableUniqueTokens = uniqueTokens?.filter(
    (uniqueToken: any) => uniqueToken.isSendable
  );
  // @ts-expect-error ts-migrate FIXME: Type 'undefined' is not assignable to type 'string'.
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
