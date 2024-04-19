import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useAnimatedGestureHandler, useSharedValue } from 'react-native-reanimated';
import { NavigationSteps, useSwapContext } from '../../providers/swap-provider';

export const useSwapActionsGestureHandler = () => {
  const gestureY = useSharedValue(0);
  const { SwapNavigation, configProgress } = useSwapContext();

  const swipeToDismissGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, ctx: { startY?: number }) => {
      if (ctx.startY) {
        ctx.startY = undefined;
      }
    },
    onActive: (e, ctx: { startY?: number }) => {
      if (ctx.startY === undefined) {
        ctx.startY = e.absoluteY;
      }

      const yDelta = e.absoluteY - ctx.startY;
      gestureY.value = yDelta;
    },
    onEnd: (e, ctx: { startY?: number }) => {
      const yDelta = e.absoluteY - (ctx.startY || 0);

      const isBeyondDismissThreshold = yDelta > 80;
      if (isBeyondDismissThreshold) {
        if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
          SwapNavigation.handleDismissReview();
        } else if (configProgress.value === NavigationSteps.SHOW_GAS) {
          SwapNavigation.handleDismissGas();
        }
      }
      gestureY.value = 0;
    },
  });

  return {
    swipeToDismissGestureHandler,
    gestureY,
  };
};
