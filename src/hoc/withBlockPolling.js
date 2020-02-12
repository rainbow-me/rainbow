import { connect } from 'react-redux';
import {
  web3ListenerInit,
  web3ListenerStop,
  web3UpdateReserves,
} from '../redux/web3listener';

export default Component =>
  connect(null, {
    web3ListenerInit,
    web3ListenerStop,
    web3UpdateReserves,
  })(Component);
