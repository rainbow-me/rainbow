import { useNavigation } from '@/navigation';
import { RootStackParamList } from '@/navigation/types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useSwapContext } from '../providers/swap-provider';

export const NavigateToSwapSettingsTrigger = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Swap'>>();
  const { setParams } = useNavigation();
  const { SwapNavigation } = useSwapContext();

  useAnimatedReaction(
    () => route.params,
    (current, previous) => {
      if (current === previous) return;

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
