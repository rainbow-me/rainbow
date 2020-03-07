import { connect } from 'react-redux';
import {
  clearSelectedCoins,
  pushSelectedCoin,
  removeSelectedCoin,
  setHiddenCoins,
  setIsCoinListEdited,
  setPinnedCoins,
} from '../redux/editOptions';

const mapStateToProps = ({ editOptions: { isCoinListEdited } }) => ({
  isCoinListEdited,
});

export default Component =>
  connect(mapStateToProps, {
    clearSelectedCoins,
    pushSelectedCoin,
    removeSelectedCoin,
    setHiddenCoins,
    setIsCoinListEdited,
    setPinnedCoins,
  })(Component);
