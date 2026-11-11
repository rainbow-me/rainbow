import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { SwapAssetType } from '@/__swaps__/types/swap';
import { useOnChange } from '@/hooks/useOnChange';
import { useNavigation } from '@/navigation/Navigation';
import { useRoute } from '@/navigation/RouteContext';
import type Routes from '@/navigation/routesNames';

import { useSwapContext } from '../providers/swap-provider';

export const SwapRouteParamsObserver = () => {
  const route = useRoute<typeof Routes.SWAP>();
  const { setParams } = useNavigation<typeof Routes.SWAP>();
  const { setAsset, SwapNavigation } = useSwapContext();

  useOnChange(() => {
    setAsset(
      { asset: route.params.inputAsset, percentageToSell: route.params.percentageToSell, type: SwapAssetType.inputAsset },
      route.params.outputAsset
    );
  }, [route.params.inputAsset, route.params.outputAsset, route.params.percentageToSell]);

  useAnimatedReaction(
    () => route.params,
    (current, previous) => {
      if (!current || current === previous) return;

      if (current.action === 'open_swap_settings') {
        SwapNavigation.handleShowSettings();
        runOnJS(setParams)({ ...route.params, action: undefined });
      }
    },
    [route.params?.action, setParams]
  );

  return null;
};
