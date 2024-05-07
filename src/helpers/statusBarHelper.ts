import { ColorValue, StatusBar, StatusBarAnimation } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';

export const setTranslucent = (translucent: boolean): void => {
  StatusBar.setTranslucent(translucent);
};

export const setInitialSettings = (): void => {
  StatusBar.setBackgroundColor('transparent', false);
  StatusBar.setTranslucent(true);
  StatusBar.setBarStyle('dark-content', true);
};
export const setBackgroundColor = (color: ColorValue, animated?: boolean): void => {
  StatusBar.setBackgroundColor(color, animated);
};
export const setHidden = (hidden: boolean, animation?: StatusBarAnimation): void => {
  StatusBar.setHidden(hidden, animation);
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

export const isUsingButtonNavigation = () => {
  return getSoftMenuBarHeight() > 95;
};
