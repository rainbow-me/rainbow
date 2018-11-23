import { transactionsToApproveInit } from '../redux/transactionsToApprove';
import { connect } from 'react-redux';

export default Component => connect(null, { transactionsToApproveInit })(Component);
