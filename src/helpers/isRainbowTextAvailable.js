import { UIManager } from 'react-native';

const useRainbowTextAvailable = () =>
  !!UIManager.getViewManagerConfig('RainbowText');

export default useRainbowTextAvailable;
