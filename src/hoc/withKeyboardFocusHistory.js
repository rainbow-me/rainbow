import { connect } from 'react-redux';
import {
  clearKeyboardFocusHistory,
  pushKeyboardFocusHistory,
} from '../redux/keyboardFocusHistory';

const mapStateToProps = ({ keyboardFocusHistory }) => keyboardFocusHistory;

export default connect(mapStateToProps, {
  clearKeyboardFocusHistory,
  pushKeyboardFocusHistory,
});
