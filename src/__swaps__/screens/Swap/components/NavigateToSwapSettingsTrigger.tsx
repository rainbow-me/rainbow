import { Navigation } from '@/navigation';
import { RootStackParamList } from '@/navigation/types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useSwapContext } from '../providers/swap-provider';
import Routes from '@/navigation/routesNames';

export const NavigateToSwapSettingsTrigger = () => {
  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.SWAP>>();
  const { SwapNavigation } = useSwapContext();

  useAnimatedReaction(
    () => route.params,
    (current, previous) => {
      if (!current || current === previous) return;

      if (current.action === 'open_swap_settings') {
        SwapNavigation.handleShowSettings();

        runOnJS(Navigation.setParams<typeof Routes.SWAP>)({
          ...route.params,
          action: undefined,
        });
      }
    },
    [route.params?.action]
  );

  return null;
};
