import { connect } from 'react-redux';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';

const mapStateToProps = ({ isWalletEthZero }) => isWalletEthZero;

export default Component => connect(mapStateToProps, { setIsWalletEthZero })(Component);
