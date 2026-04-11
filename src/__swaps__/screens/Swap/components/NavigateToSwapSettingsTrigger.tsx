import { useRoute, type RouteProp } from '@react-navigation/native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useNavigation } from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';

import { useSwapContext } from '../providers/swap-provider';

export const NavigateToSwapSettingsTrigger = () => {
  const route = useRoute<RouteProp<RootStackParamList, typeof Routes.SWAP>>();
  const { setParams } = useNavigation<typeof Routes.SWAP>();
  const { SwapNavigation } = useSwapContext();

  useAnimatedReaction(
    () => route.params,
    (current, previous) => {
      if (!current || current === previous) return;

      if (current.action === 'open_swap_settings') {
        SwapNavigation.handleShowSettings();
        runOnJS(setParams)({
          ...route.params,
          action: undefined,
        });
      }
    },
    [route.params?.action, setParams]
  );

  return null;
};
