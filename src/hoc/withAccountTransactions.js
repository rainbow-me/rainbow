import { connect } from 'react-redux';

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
  transactionsCount: (transactions || []).length,
});

export default Component => connect(mapStateToProps)(Component);
