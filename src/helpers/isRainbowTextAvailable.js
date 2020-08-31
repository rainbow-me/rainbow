import { UIManager } from 'react-native';
import useExperimentalFlag, { RAINBOW_TEXT } from '../config/experimentalHooks';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';

const useNativeButtonAvailable = () => {
  const isRainbowTextAvailable = useExperimentalFlag(RAINBOW_TEXT);

  return (
    isRainbowTextAvailable &&
    isNativeStackAvailable &&
    !!UIManager.getViewManagerConfig('RainbowText')
  );
};

export default useNativeButtonAvailable;
