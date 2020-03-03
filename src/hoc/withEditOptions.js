import { connect } from 'react-redux';
import {
  clearSelectedCoins,
  pushSelectedCoin,
  removeSelectedCoin,
  setIsCoinListEdited,
  setPinnedCoins,
} from '../redux/editOptions';

const mapStateToProps = ({
  editOptions: { isCoinListEdited, wasRecentlyPinned },
}) => ({
  isCoinListEdited,
  wasRecentlyPinned,
});

export default Component =>
  connect(mapStateToProps, {
    clearSelectedCoins,
    pushSelectedCoin,
    removeSelectedCoin,
    setIsCoinListEdited,
    setPinnedCoins,
  })(Component);
