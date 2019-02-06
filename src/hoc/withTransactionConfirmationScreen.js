import { transactionsAddNewTransaction } from 'balance-common';
import { connect } from 'react-redux';
import { removeTransaction } from '../redux/transactionsToApprove';
import { updateTransactionCountNonce } from '../redux/nonce';
import { walletConnectSendStatus } from '../redux/walletconnect';

const mapStateToProps = ({
  nonce: { transactionCountNonce },
}) => ({
  transactionCountNonce,
});

export default Component => connect(mapStateToProps, {
  transactionsAddNewTransaction,
  removeTransaction,
  updateTransactionCountNonce,
  walletConnectSendStatus,
})(Component);
