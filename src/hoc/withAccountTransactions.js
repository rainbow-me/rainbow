import { connect } from 'react-redux';

const EMPTY_ARRAY = [];

const mapStateToProps = ({
  account: {
    fetchingTransactions,
    hasPendingTransaction,
    transactions,
  },
}) => ({
  fetchingTransactions,
  hasPendingTransaction,
  transactions,
  transactionsCount: (transactions || EMPTY_ARRAY).length,
});

export default Component => connect(mapStateToProps)(Component);
