import { connect } from 'react-redux';

const mapStateToProps = ({ navigation: { transitionProps } }) => ({
  transitionProps,
});

export default Component => connect(mapStateToProps)(Component);
