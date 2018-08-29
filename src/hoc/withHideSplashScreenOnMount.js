import { compose, lifecycle } from 'recompact';
import withHideSplashScreen from './withHideSplashScreen';

export default Component => compose(
  withHideSplashScreen,
  lifecycle({
    componentDidMount() {
      this.props.onHideSplashScreen();
    },
  }),
)(Component);
