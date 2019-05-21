import { connect } from 'react-redux';
import { transactionsForTopic, transactionsToApproveInit } from '../redux/transactionsToApprove';

export default Component => connect(null, { transactionsForTopic, transactionsToApproveInit })(Component);
