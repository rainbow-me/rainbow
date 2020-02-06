import { connect } from 'react-redux';
import { wyreAddOrder, wyreClearState } from '../redux/wyre';

const mapStateToProps = ({
  wyre: { orderId, orderStatus, transferHash, transferId, transferStatus },
}) => ({
  orderId,
  orderStatus,
  transferHash,
  transferId,
  transferStatus,
});

export default Component =>
  connect(mapStateToProps, { wyreAddOrder, wyreClearState })(Component);
