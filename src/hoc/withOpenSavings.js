import { connect } from 'react-redux';
import { setOpenSavings } from '../redux/openStateSettings';

const mapStateToProps = ({ openStateSettings: { openSavings } }) => ({
  openSavings,
});

export default Component =>
  connect(mapStateToProps, { setOpenSavings })(Component);
