import {
  InteractionManager,
  NativeModules,
  Platform,
  StatusBar,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { iconOnSplashScreenAnimated } from '../config/experimental';

export default function hideSplashScreen() {
  const { RainbowSplashScreen } = NativeModules;
  if (
    RainbowSplashScreen &&
    RainbowSplashScreen.hideAnimated &&
    iconOnSplashScreenAnimated
  ) {
    RainbowSplashScreen.hideAnimated();
  } else {
    SplashScreen.hide();
  }
  // show the StatusBar
  (Platform.OS === 'ios' && StatusBar.setHidden(false, 'fade')) ||
    InteractionManager.runAfterInteractions(() => {
      StatusBar.setHidden(false, 'fade');
    });
}
