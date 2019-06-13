import { uniqueTokensRefreshState } from '../redux/assets';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';

export default Component => compose(
  connect(null, { uniqueTokensRefreshState }),
  withHandlers({
    refreshAccount: (ownProps) => async () => {
      try {
        await ownProps.uniqueTokensRefreshState();
      } catch (error) {
        // TODO more granular error messaging depending on offline status
      }
    },
  }),
)(Component);
