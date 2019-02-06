import { connect } from 'react-redux';
import { walletConnectInitNewSession } from '../redux/walletconnect';

export default Component => connect(
  null,
  { walletConnectInitNewSession },
)(Component);
