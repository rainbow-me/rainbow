import { connect } from 'react-redux';

const mapStateToProps = ({ editOptions: { currentAction } }) => ({
  currentAction,
});

export default Component => connect(mapStateToProps, {})(Component);
