import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { sendableUniqueTokensSelector } from './uniqueTokenSelectors';

const mapStateToProps = ({
  assets: {
    fetchingUniqueTokens,
    uniqueTokens,
  },
  settings: { nativeCurrency },
}) => ({
  fetchingUniqueTokens,
  nativeCurrency,
  uniqueTokens,
});

const sendableUniqueTokens = (state) => sendableUniqueTokensSelector(state);

export default Component => compose(
  connect(mapStateToProps),
  withProps(sendableUniqueTokens),
)(Component);
