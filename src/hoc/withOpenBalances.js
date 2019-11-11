import { connect } from 'react-redux';
import { setOpenSmallBalances } from '../redux/openBalances';

const mapStateToProps = ({ openBalances: { openSmallBalances } }) => ({
  openSmallBalances,
});

export default Component =>
  connect(mapStateToProps, { setOpenSmallBalances })(Component);
