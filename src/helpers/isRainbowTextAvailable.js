import { UIManager } from 'react-native';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';

const useNativeButtonAvailable = () =>
  isNativeStackAvailable && !!UIManager.getViewManagerConfig('RainbowText');

export default useNativeButtonAvailable;
