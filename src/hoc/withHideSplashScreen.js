import SplashScreen from 'react-native-splash-screen';
import { withProps } from 'recompact';

export default Component => withProps({
  onHideSplashScreen: () => SplashScreen.hide(),
})(Component);
