import SplashScreen from 'react-native-splash-screen';
import { withHandlers } from 'recompact';

export default Component => withHandlers({
  onHideSplashScreen: () => () => SplashScreen.hide(),
})(Component);
