import { connect } from 'react-redux';
import {
  pushOpenInvestmentCard,
  setOpenInvestmentCards,
} from '../redux/openStateSettings';

const mapStateToProps = ({ openStateSettings: { openInvestmentCards } }) => ({
  openInvestmentCards,
});

export default Component =>
  connect(mapStateToProps, {
    pushOpenInvestmentCard,
    setOpenInvestmentCards,
  })(Component);
