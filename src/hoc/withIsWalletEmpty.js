import { connect } from 'react-redux';
import { setIsWalletEmpty } from '../redux/isWalletEmpty';

const mapStateToProps = ({ isWalletEmpty }) => isWalletEmpty;

export default Component => connect(mapStateToProps, { setIsWalletEmpty })(Component);
