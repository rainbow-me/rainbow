import { uniqueTokensRefreshState } from '@rainbow-me/rainbow-common';
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
