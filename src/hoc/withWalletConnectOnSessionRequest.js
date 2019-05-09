import { connect } from 'react-redux';
import { walletConnectOnSessionRequest } from '../redux/walletconnect';

export default Component => connect(
  null,
  { walletConnectOnSessionRequest },
)(Component);
