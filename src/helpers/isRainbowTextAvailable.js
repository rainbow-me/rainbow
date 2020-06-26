import { UIManager } from 'react-native';
import useExperimentalFlag, { RAINBOW_TEXT } from '../config/experimentalHooks';

const useNativeButtonAvailable = () => {
  const isRainbowTextAvailable = useExperimentalFlag(RAINBOW_TEXT);

  return (
    isRainbowTextAvailable && !!UIManager.getViewManagerConfig('RainbowText')
  );
};

export default useNativeButtonAvailable;
