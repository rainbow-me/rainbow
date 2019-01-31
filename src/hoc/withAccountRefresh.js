import { AlertIOS } from 'react-native';
import { assetsRefreshState, transactionsRefreshState } from 'balance-common';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';

export default Component => compose(
  connect(null, { assetsRefreshState, transactionsRefreshState }),
  withHandlers({
    refreshAccount: (ownProps) => async () => {
      try {
        await ownProps.assetsRefreshState();
        ownProps.transactionsRefreshState();
      } catch (error) {
        // TODO more granular error messaging depending on offline status
      }
    },
  }),
)(Component);
