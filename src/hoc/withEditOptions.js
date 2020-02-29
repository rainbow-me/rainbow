import { connect } from 'react-redux';
import { setIsCoinListEdited, setPinnedCoins } from '../redux/editOptions';

const mapStateToProps = ({ editOptions: { isCoinListEdited } }) => ({
  isCoinListEdited,
});

export default Component =>
  connect(mapStateToProps, { setIsCoinListEdited, setPinnedCoins })(Component);
