import { connect } from 'react-redux';
import { setOpenFamilyTabs } from '../redux/openFamilyTabs';
import { pushOpenFamilyTab } from '../redux/openFamilyTabs';

const mapStateToProps = ({ openFamilyTabs: { openFamilyTabs } }) => ({ openFamilyTabs });

export default Component => connect(mapStateToProps, { setOpenFamilyTabs, pushOpenFamilyTab })(Component);
