import { connect } from '@rainbow-me/react-redux';

const mapStateToProps = ({ editOptions: { isCoinListEdited } }) => ({
  isCoinListEdited,
});

export default Component => connect(mapStateToProps, {})(Component);
