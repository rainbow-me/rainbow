import { transactionsAddNewTransaction } from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { updateTransactionCountNonce } from '../redux/nonce';
import { removeTransaction } from '../redux/transactionsToApprove';
import { walletConnectSendStatus } from '../redux/walletconnect';

const mapStateToProps = ({
  nonce: { transactionCountNonce },
}) => ({
  transactionCountNonce,
});

export default Component => connect(mapStateToProps, {
  removeTransaction,
  transactionsAddNewTransaction,
  updateTransactionCountNonce,
  walletConnectSendStatus,
})(Component);
