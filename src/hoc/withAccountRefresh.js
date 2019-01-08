import { assetsRefreshState, pricesRefreshState, transactionsRefreshState } from 'balance-common';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';

export default Component => compose(
  connect(null, { assetsRefreshState, pricesRefreshState, transactionsRefreshState }),
  withHandlers({
    refreshAccount: ({ assetsRefreshState, pricesRefreshState, transactionsRefreshState }) => () => {
      assetsRefreshState();
      pricesRefreshState();
      transactionsRefreshState();
    },
  }),
)(Component);
