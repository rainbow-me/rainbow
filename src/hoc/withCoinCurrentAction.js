import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ editOptions: { currentAction } }) => ({
  currentAction,
});

export default Component => connect(mapStateToProps, {})(Component);
