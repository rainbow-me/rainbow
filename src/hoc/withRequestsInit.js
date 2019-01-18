import { connect } from 'react-redux';
import { transactionsToApproveInit } from '../redux/transactionsToApprove';

export default Component => connect(null, { transactionsToApproveInit })(Component);
