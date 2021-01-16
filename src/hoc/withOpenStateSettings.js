import { connect } from 'react-redux';
import {
  pushOpenFamilyTab,
  setOpenFamilyTabs,
  setOpenInvestmentCards,
  setOpenSavings,
} from '../redux/openStateSettings';

const mapStateToProps = ({
  openStateSettings: { openFamilyTabs, openInvestmentCards },
  openSavings,
}) => ({
  openFamilyTabs,
  openInvestmentCards,
  openSavings,
});

export default Component =>
  connect(mapStateToProps, {
    pushOpenFamilyTab,
    setOpenFamilyTabs,
    setOpenInvestmentCards,
    setOpenSavings,
  })(Component);
