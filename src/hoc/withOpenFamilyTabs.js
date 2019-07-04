import { connect } from 'react-redux';
import { pushOpenFamilyTab, setOpenFamilyTabs } from '../redux/openFamilyTabs';

const mapStateToProps = ({ openFamilyTabs: { openFamilyTabs } }) => ({ openFamilyTabs });

export default Component => connect(mapStateToProps, {
  pushOpenFamilyTab,
  setOpenFamilyTabs,
})(Component);
