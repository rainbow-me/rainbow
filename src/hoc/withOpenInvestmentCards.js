import { connect } from 'react-redux';
import { setOpenInvestmentCards } from '../redux/openStateSettings';

const mapStateToProps = ({ openStateSettings: { openInvestmentCards } }) => ({
  openInvestmentCards,
});

export default Component =>
  connect(mapStateToProps, {
    setOpenInvestmentCards,
  })(Component);
