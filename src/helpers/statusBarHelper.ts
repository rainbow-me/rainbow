import {
  ColorValue,
  StatusBar,
  StatusBarAnimation,
  Dimensions,
} from 'react-native';

export const setTranslucent = (translucent: boolean): void => {
  StatusBar.setTranslucent(translucent);
};

export const setInitialSettings = (): void => {
  StatusBar.setBackgroundColor('transparent', false);
  StatusBar.setTranslucent(true);
  StatusBar.setBarStyle('dark-content', true);
};
export const setBackgroundColor = (
  color: ColorValue,
  animated?: boolean
): void => {
  StatusBar.setBackgroundColor(color, animated);
};
export const setHidden = (
  hidden: boolean,
  animation?: StatusBarAnimation
): void => {
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
  const deviceHeight = Dimensions.get('screen').height;
  const windowHeight = Dimensions.get('window').height;
  const bottomNavBarHeight = deviceHeight - windowHeight;
  return bottomNavBarHeight > 70;
};
