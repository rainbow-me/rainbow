import { transactionsAddNewTransaction } from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { removeTransaction } from '../redux/transactionsToApprove';
import { updateTransactionCountNonce } from '../redux/nonce';

const mapStateToProps = ({
  walletconnect: { walletConnectors },
  nonce: { transactionCountNonce },
}) => ({
  transactionCountNonce,
  walletConnectors,
});

export default Component => connect(mapStateToProps, {
  removeTransaction,
  transactionsAddNewTransaction,
  updateTransactionCountNonce,
})(Component);
