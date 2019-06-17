import { assetsRefreshState, transactionsRefreshState } from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';

export default Component => compose(
  connect(null, {
    assetsRefreshState,
    transactionsRefreshState,
  }),
  withHandlers({
    refreshAccount: (ownProps) => async () => {
      try {
        await ownProps.assetsRefreshState();
      } catch (error) {
      }
      try {
        await ownProps.transactionsRefreshState();
      } catch (error) {
      }
    },
  }),
)(Component);
