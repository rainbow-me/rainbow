import { assetsRefreshState, transactionsRefreshState } from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { setAssetsFetched, setTransactionFetched } from '../redux/initialFetch';

export default Component => compose(
  connect(null, {
    assetsRefreshState,
    setAssetsFetched,
    setTransactionFetched,
    transactionsRefreshState,
  }),
  withHandlers({
    refreshAccount: (ownProps) => async () => {
      try {
        await ownProps.assetsRefreshState();
        ownProps.setAssetsFetched();
      } catch (error) {
        ownProps.setAssetsFetched();
      }
      try {
        await ownProps.transactionsRefreshState();
        ownProps.setTransactionFetched();
      } catch (error) {
        ownProps.setTransactionFetched();
      }
    },
  }),
)(Component);
