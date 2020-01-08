import { StatusBar } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { withHandlers } from 'recompact';

export default Component =>
  withHandlers({
    onHideSplashScreen: () => () => {
      SplashScreen.hide();
      StatusBar.setHidden(false, 'fade'); // show the StatusBar
    },
  })(Component);
