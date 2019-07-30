import { connect } from 'react-redux';
import { setIsWalletImporting } from '../redux/isWalletImporting';

const mapStateToProps = ({ isWalletImporting }) => isWalletImporting;

export default Component => connect(mapStateToProps, { setIsWalletImporting })(Component);
