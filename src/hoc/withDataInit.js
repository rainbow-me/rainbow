import { connect } from 'react-redux';
import { dataInit } from '../redux/data';

export default Component => connect(null, { dataInit })(Component);
