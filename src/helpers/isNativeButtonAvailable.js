import { UIManager } from 'react-native';
import { nativeButtonPressAnimationAvailable } from '../experimentalConfig';

export default nativeButtonPressAnimationAvailable &&
  !!UIManager.getViewManagerConfig('Button');
