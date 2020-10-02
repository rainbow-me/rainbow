import { connect } from 'react-redux';
import { pushSelectedCoin, removeSelectedCoin } from '../redux/editOptions';

const mapStateToProps = ({ editOptions: { recentlyPinnedCount } }) => ({
  recentlyPinnedCount,
});

export default Component =>
  connect(mapStateToProps, {
    pushSelectedCoin,
    removeSelectedCoin,
  })(Component);
