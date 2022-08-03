import { StatusBar as RNStatusBar, StatusBarAnimation } from 'react-native';
import { StatusBar, StatusBarProps } from 'react-native-bars';

export const setTranslucent = (translucent: boolean): void => {
  RNStatusBar.setTranslucent(translucent);
};

export const setHidden = (
  hidden: boolean,
  animation?: StatusBarAnimation
): void => {
  RNStatusBar.setHidden(hidden, animation);
};

export const pushStackEntry = (props: StatusBarProps) => {
  return StatusBar.pushStackEntry(props);
};

export const setLightContent = (isAnimated = true) => {
  StatusBar.pushStackEntry({
    animated: isAnimated,
    barStyle: 'light-content',
  });
};

export const setDarkContent = (isAnimated = true) => {
  StatusBar.pushStackEntry({
    animated: isAnimated,
    barStyle: 'dark-content',
  });
};
