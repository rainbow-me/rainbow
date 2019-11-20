import { connect } from 'react-redux';
import { setOpenSmallBalances } from '../redux/openStateSettings';

const mapStateToProps = ({ openStateSettings: { openSmallBalances } }) => ({
  openSmallBalances,
});

export default Component =>
  connect(mapStateToProps, { setOpenSmallBalances })(Component);
