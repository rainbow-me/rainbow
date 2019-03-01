import { assetsRefreshState, transactionsRefreshState } from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { setAssetsFetched, setTransactionFetched } from '../redux/initialFetch';

export default Component => compose(
  connect(null, {
    assetsRefreshState, setAssetsFetched, setTransactionFetched, transactionsRefreshState,
  }),
  withHandlers({
    refreshAccount: (ownProps) => async () => {
      try {
        await ownProps.assetsRefreshState();
        ownProps.setAssetsFetched();
        await ownProps.transactionsRefreshState();
        ownProps.setTransactionFetched();
      } catch (error) {
        // TODO more granular error messaging depending on offline status
      }
    },
  }),
)(Component);
