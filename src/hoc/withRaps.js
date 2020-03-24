import { connect } from 'react-redux';
import { rapsAddOrUpdate, rapsLoad, rapsRemove } from '../redux/raps';

const mapStateToProps = ({ raps: { raps } }) => ({
  raps,
});

export default Component =>
  connect(mapStateToProps, {
    rapsAddOrUpdate,
    rapsLoad,
    rapsRemove,
  })(Component);
