import { connect } from 'react-redux';
import { setKeyboardHeight } from '../redux/keyboardHeight';

const mapStateToProps = ({ keyboardHeight }) => keyboardHeight;

export default connect(mapStateToProps, { setKeyboardHeight });
