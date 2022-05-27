import { UIManager } from 'react-native';

const useNativeButtonAvailable = () =>
  !!UIManager.getViewManagerConfig('Button');

export default useNativeButtonAvailable;
