import SafeAreaView from 'react-native-safe-area-view';

export default {
  bottom: SafeAreaView.getInset('bottom') || 0,
  left: SafeAreaView.getInset('left') || 0,
  right: SafeAreaView.getInset('right') || 0,
  top: SafeAreaView.getInset('top') || 0,
};
