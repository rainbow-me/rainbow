import { InteractionManager, Platform, StatusBar } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { withHandlers } from 'recompact';

export default Component =>
  withHandlers({
    onHideSplashScreen: () => () => {
      SplashScreen.hide();
      // show the StatusBar
      (Platform.OS === 'ios' && StatusBar.setHidden(false, 'fade')) ||
        InteractionManager.runAfterInteractions(() => {
          StatusBar.setHidden(false, 'fade');
        });
    },
  })(Component);
