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

const sendableUniqueTokens = (state) => sendableUniqueTokensSelector(state);

export default Component => compose(
  connect(mapStateToProps),
  withProps(sendableUniqueTokens),
)(Component);
