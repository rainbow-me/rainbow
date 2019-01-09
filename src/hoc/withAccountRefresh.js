import { assetsRefreshState, transactionsRefreshState } from 'balance-common';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';

export default Component => compose(
  connect(null, { assetsRefreshState, transactionsRefreshState }),
  withHandlers({
    refreshAccount: (ownProps) => async () => {
      ownProps.assetsRefreshState();
      await ownProps.transactionsRefreshState();
    },
  }),
)(Component);
