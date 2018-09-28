import { transactionsToApproveInit } from '../reducers/transactionsToApprove';
import { connect } from 'react-redux';

export default Component => connect(null, { transactionsToApproveInit })(Component);
