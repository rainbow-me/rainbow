import { UIManager } from 'react-native';
import { isRainbowTextAvailable } from '../config/experimental';

export default isRainbowTextAvailable &&
  !!UIManager.getViewManagerConfig('RainbowText');
