import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';

const EMPTY_ARRAY = [];

const mapStateToProps = ({
  account: {
    fetchingTransactions,
    hasPendingTransaction,
    nativeCurrency,
    transactions,
  },
}) => ({
  fetchingTransactions,
  hasPendingTransaction,
  nativeCurrency,
  transactions,
});

const getTransactionsCount = ({ transactions }) => ({
  transactionsCount: (transactions || EMPTY_ARRAY).length,
});

export default Component => compose(
  connect(mapStateToProps),
  withProps(getTransactionsCount),
)(Component);
