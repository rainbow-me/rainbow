import { connect } from 'react-redux';
import { FETCHED_ASSETS } from '../redux/initialFetch';

const mapStateToProps = ({ initialFetch: { fetchingState } }) => ({ areTransactionsFetching: fetchingState === FETCHED_ASSETS });

export default Component => connect(mapStateToProps)(Component);
