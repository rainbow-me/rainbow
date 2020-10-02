import {
  pushOpenInvestmentCard,
  setOpenInvestmentCards,
} from '../redux/openStateSettings';
import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ openStateSettings: { openInvestmentCards } }) => ({
  openInvestmentCards,
});

export default Component =>
  connect(mapStateToProps, {
    pushOpenInvestmentCard,
    setOpenInvestmentCards,
  })(Component);
