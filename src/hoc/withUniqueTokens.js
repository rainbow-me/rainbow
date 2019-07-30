import { groupBy } from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { sendableUniqueTokensSelector } from './uniqueTokenSelectors';

const mapStateToProps = ({
  uniqueTokens: {
    uniqueTokens,
  },
  settings: { nativeCurrency },
}) => ({
  nativeCurrency,
  uniqueTokens,
});

const sendableUniqueTokens = (state) => {
  const sendableUniqueTokens = sendableUniqueTokensSelector(state).sendableUniqueTokens;
  const grouped = groupBy(sendableUniqueTokens, token => token.asset_contract.name);
  const families = Object.keys(grouped).sort();
  let sendableTokens = []
  for (let i = 0; i < families.length; i++) {
    let newObject = {};
    newObject = {
      name: families[i], 
      familyImage: grouped[families[i]][0].familyImage,
      familyId: i, 
      data: grouped[families[i]],
    };
    sendableTokens.push(newObject);
  };
  return { sendableUniqueTokens: sendableTokens};
}

export default Component => compose(
  connect(mapStateToProps),
  withProps(sendableUniqueTokens),
)(Component);
