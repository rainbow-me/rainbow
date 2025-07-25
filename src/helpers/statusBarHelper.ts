import { SystemBars } from 'react-native-edge-to-edge';

export const setInitialSettings = (): void => {
  SystemBars.setStyle({ statusBar: 'dark' });
};

export const setHidden = (hidden: boolean): void => {
  SystemBars.setHidden({ statusBar: hidden });
};

export const setLightContent = () => {
  SystemBars.setStyle({ statusBar: 'light' });
};

export const setDarkContent = () => {
  SystemBars.setStyle({ statusBar: 'dark' });
};
