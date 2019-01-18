import { connect } from 'react-redux';

const mapStateToProps = ({ prices: { fetchingPrices } }) => ({ fetchingPrices });

export default Component => connect(mapStateToProps)(Component);
