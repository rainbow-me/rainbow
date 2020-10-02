import {
  pushOpenFamilyTab,
  setOpenFamilyTabs,
} from '../redux/openStateSettings';
import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ openStateSettings: { openFamilyTabs } }) => ({
  openFamilyTabs,
});

export default Component =>
  connect(mapStateToProps, {
    pushOpenFamilyTab,
    setOpenFamilyTabs,
  })(Component);
