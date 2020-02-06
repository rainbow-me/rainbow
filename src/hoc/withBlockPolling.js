import { connect } from 'react-redux';
import { web3ListenerInit, web3ListenerStop } from '../redux/web3listener';

export default Component =>
  connect(null, {
    web3ListenerInit,
    web3ListenerStop,
  })(Component);
