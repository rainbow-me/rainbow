import { connect } from 'react-redux';
import { assetsLoadState, dataInit } from '../redux/data';

export default Component => connect(null, { assetsLoadState, dataInit })(Component);
