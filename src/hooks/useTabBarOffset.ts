import { BASE_TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useTabBarOffset = () => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  return bottomInset + BASE_TAB_BAR_HEIGHT + 6;
};
