import { setOpenSmallBalances } from '../redux/openStateSettings';
import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ openStateSettings: { openSmallBalances } }) => ({
  openSmallBalances,
});

export default Component =>
  connect(mapStateToProps, { setOpenSmallBalances })(Component);
