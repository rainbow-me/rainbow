import { connect } from 'react-redux';

const mapStateToProps = ({ navigation: { transitionProps } }) => ({ transitionProps });

const withTransitionProps = Component => connect(mapStateToProps)(Component);

export default withTransitionProps;
