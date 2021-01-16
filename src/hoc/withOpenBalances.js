import { connect } from 'react-redux';
import { setOpenSmallBalances } from '../redux/openStateSettings';

const mapStateToProps = ({ openSmallBalances }) => ({
  openSmallBalances,
});

export default Component =>
  connect(mapStateToProps, { setOpenSmallBalances })(Component);
