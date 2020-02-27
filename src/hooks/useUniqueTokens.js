import { groupBy } from 'lodash';
import { useSelector } from 'react-redux';
import { sendableUniqueTokensSelector } from '../hoc/uniqueTokenSelectors';

const sendableUniqueTokens = state => {
  const sendableUniqueTokens = sendableUniqueTokensSelector(state)
    .sendableUniqueTokens;
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
  return { sendableUniqueTokens: sendableTokens };
};

export default function useUniqueTokens() {
  const uniqueTokensData = useSelector(
    ({ uniqueTokens: { uniqueTokens }, settings: { nativeCurrency } }) => {
      return {
        nativeCurrency,
        uniqueTokens,
      };
    }
  );

  return Object.assign(
    uniqueTokensData,
    sendableUniqueTokens(uniqueTokensData)
  );
}
