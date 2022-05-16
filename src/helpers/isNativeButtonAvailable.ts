import { UIManager } from 'react-native';

const useNativeButtonAvailable = (): boolean =>
  !!UIManager.getViewManagerConfig('Button');

export default useNativeButtonAvailable;
