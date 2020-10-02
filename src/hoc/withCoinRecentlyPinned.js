import { pushSelectedCoin, removeSelectedCoin } from '../redux/editOptions';
import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ editOptions: { recentlyPinnedCount } }) => ({
  recentlyPinnedCount,
});

export default Component =>
  connect(mapStateToProps, {
    pushSelectedCoin,
    removeSelectedCoin,
  })(Component);
