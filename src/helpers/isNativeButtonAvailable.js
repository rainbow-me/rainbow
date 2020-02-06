import { UIManager } from 'react-native';
import { nativeButtonPressAnimationAvailable } from '../config/experimental';

export default nativeButtonPressAnimationAvailable &&
  !!UIManager.getViewManagerConfig('Button');
