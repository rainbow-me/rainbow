import { useCallback } from 'react';
import { InteractionManager, Platform, StatusBar } from 'react-native';
import SplashScreen from 'react-native-splash-screen';

export default function useHideSplashScreen() {
  const onHideSplashScreen = useCallback(() => {
    SplashScreen.hide();
    // show the StatusBar
    (Platform.OS === 'ios' && StatusBar.setHidden(false, 'fade')) ||
      InteractionManager.runAfterInteractions(() => {
        StatusBar.setHidden(false, 'fade');
      });
  }, []);
  return onHideSplashScreen;
}
