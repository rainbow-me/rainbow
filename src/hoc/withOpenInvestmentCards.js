import { connect } from 'react-redux';
import {
  pushOpenInvestmentCard,
  setOpenInvestmentCards,
} from '../redux/openInvestmentCards';

const mapStateToProps = ({ openInvestmentCards: { openInvestmentCards } }) => ({
  openInvestmentCards,
});

export default Component =>
  connect(mapStateToProps, {
    pushOpenInvestmentCard,
    setOpenInvestmentCards,
  })(Component);
