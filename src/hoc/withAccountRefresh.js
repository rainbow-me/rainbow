import { assetsRefreshState, transactionsRefreshState } from 'balance-common';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';

export default Component => compose(
  connect(null, { assetsRefreshState, transactionsRefreshState }),
  withHandlers({
    refreshAccount: ({ assetsRefreshState, transactionsRefreshState }) => async () => {
      transactionsRefreshState();
      await assetsRefreshState();
    },
  }),
)(Component);
