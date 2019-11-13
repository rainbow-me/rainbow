import { connect } from 'react-redux';
import { setSelectedInputId } from '../redux/selectedInput';

const mapStateToProps = ({ selectedInput: { selectedInputId } }) => ({
  selectedInputId,
});

export default Component =>
  connect(mapStateToProps, { setSelectedInputId })(Component);
