import { connect } from 'react-redux';
import {
  setActionType,
  setScrollingVelocity,
  updateSelectedID,
} from '../redux/selectedWithFab';

const mapStateToProps = ({ selectedWithFab: { selectedId } }) => ({ selectedId });

export default Component => connect(mapStateToProps, {
  setActionType,
  setScrollingVelocity,
  updateSelectedID,
})(Component);
