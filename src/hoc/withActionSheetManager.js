import { connect } from 'react-redux';
import { setIsActionSheetOpen } from '../redux/actionSheetManager';

const mapStateToProps = ({ actionSheetManager: { isActionSheetOpen } }) => ({
  isActionSheetOpen,
});

export default Component =>
  connect(mapStateToProps, { setIsActionSheetOpen })(Component);
