import { connect } from 'react-redux';
import { setIsCoinListEdited } from '../redux/editOptions';

const mapStateToProps = ({ editOptions: { isCoinListEdited } }) => ({
  isCoinListEdited,
});

export default Component =>
  connect(mapStateToProps, { setIsCoinListEdited })(Component);
