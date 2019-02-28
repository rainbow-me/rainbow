import { connect } from 'react-redux';
import { FETCHED_TRANSACTIONS } from '../redux/initialFetch';

const mapStateToProps = ({ initialFetch: { fetchingState } }) => ({ areTransactionsFetched: fetchingState === FETCHED_TRANSACTIONS });

export default Component => connect(mapStateToProps)(Component);
