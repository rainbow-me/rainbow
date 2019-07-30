import { connect } from 'react-redux';
import {
  walletConnectApproveSession,
  walletConnectRejectSession,
} from '../redux/walletconnect';

export default Component => connect(null, {
  walletConnectApproveSession,
  walletConnectRejectSession,
})(Component);
