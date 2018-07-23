import SafeAreaView from 'react-native-safe-area-view';
import { withProps } from 'recompact';

const safeAreaInset = {
  bottom: SafeAreaView.getInset('bottom') || 0,
  left: SafeAreaView.getInset('left') || 0,
  right: SafeAreaView.getInset('right') || 0,
  top: SafeAreaView.getInset('top') || 0,
};

export default Component => withProps({ safeAreaInset })(Component);
