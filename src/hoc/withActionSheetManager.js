import { setIsActionSheetOpen } from '../redux/actionSheetManager';
import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ actionSheetManager: { isActionSheetOpen } }) => ({
  isActionSheetOpen,
});

export default Component =>
  connect(mapStateToProps, { setIsActionSheetOpen })(Component);
