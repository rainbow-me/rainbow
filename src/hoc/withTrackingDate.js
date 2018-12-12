import { connect } from 'react-redux';
import { trackingDateInit, updateTrackingDate } from '../redux/tracking';

const mapStateToProps = ({
  tracking: { trackingDate },
}) => ({
  trackingDate,
});

export default Component => connect(mapStateToProps, {
  trackingDateInit,
  updateTrackingDate,
})(Component);
