import {
  ColorValue,
  StatusBar as RNStatusBar,
  StatusBarAnimation,
} from 'react-native';
import { NavigationBar, StatusBar, StatusBarProps } from 'react-native-bars';

class StatusBarService {
  setBackgroundColor(color: ColorValue, animated?: boolean): void {
    RNStatusBar.setBackgroundColor(color, animated);
  }

  setTranslucent(translucent: boolean): void {
    RNStatusBar.setTranslucent(translucent);
  }

  setHidden(hidden: boolean, animation?: StatusBarAnimation): void {
    RNStatusBar.setHidden(hidden, animation);
  }

  pushStackEntry(props: StatusBarProps) {
    return StatusBar.pushStackEntry(props);
  }

  setLightContent(isAnimated = true) {
    StatusBar.pushStackEntry({
      animated: isAnimated,
      barStyle: 'light-content',
    });
    NavigationBar.pushStackEntry({
      barStyle: 'light-content',
    });
  }

  setDarkContent(isAnimated = true) {
    StatusBar.pushStackEntry({
      animated: isAnimated,
      barStyle: 'dark-content',
    });
    NavigationBar.pushStackEntry({
      barStyle: 'dark-content',
    });
  }
}

export default new StatusBarService();
