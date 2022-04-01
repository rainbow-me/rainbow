import {
  ColorValue,
  StatusBar as RNStatusBar,
  StatusBarProps as RNStatusBarProps,
  StatusBarAnimation,
} from 'react-native';
import { StatusBar, StatusBarProps } from 'react-native-bars';

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

  pushStackEntry(props: StatusBarProps): StatusBarProps {
    return StatusBar.pushStackEntry(props);
  }

  popStackEntry(props: RNStatusBarProps): void {
    RNStatusBar.popStackEntry(props);
  }

  setLightContent(isAnimated = true) {
    StatusBar.pushStackEntry({
      animated: isAnimated,
      barStyle: 'light-content',
    });
  }

  setDarkContent(isAnimated = true) {
    StatusBar.pushStackEntry({
      animated: isAnimated,
      barStyle: 'dark-content',
    });
  }
}

export default new StatusBarService();
