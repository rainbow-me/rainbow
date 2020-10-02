import { setOpenSavings } from '../redux/openStateSettings';
import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ openStateSettings: { openSavings } }) => ({
  openSavings,
});

export default Component =>
  connect(mapStateToProps, { setOpenSavings })(Component);
