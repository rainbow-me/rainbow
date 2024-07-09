import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { interpolate, useAnimatedGestureHandler, useSharedValue, withSpring } from 'react-native-reanimated';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';

export const useBottomPanelGestureHandler = () => {
  const gestureY = useSharedValue(0);
  const { SwapNavigation, configProgress } = useSwapContext();

  const swipeToDismissGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, ctx: { startY?: number }) => {
      if (configProgress.value !== NavigationSteps.SHOW_REVIEW && configProgress.value !== NavigationSteps.SHOW_GAS) {
        return;
      }

      if (ctx.startY) {
        ctx.startY = undefined;
      }
    },
    onActive: (e, ctx: { startY?: number }) => {
      if (configProgress.value !== NavigationSteps.SHOW_REVIEW && configProgress.value !== NavigationSteps.SHOW_GAS) {
        return;
      }

      if (ctx.startY === undefined) {
        ctx.startY = e.absoluteY;
      }

      const yDelta = e.absoluteY - ctx.startY;

      const downwardMovement = yDelta > 0 ? yDelta : 0;
      const upwardMovement = interpolate(yDelta, [-200, 0], [-200, 0], 'clamp');
      const friction = interpolate(yDelta, [-200, 0], [10, 1], 'clamp');

      gestureY.value = downwardMovement + upwardMovement / friction;
    },
    onEnd: (e, ctx: { startY?: number }) => {
      const yDelta = e.absoluteY - (ctx.startY || 0);
      const yVelocity = e.velocityY;

      const isBeyondDismissThreshold = (yVelocity >= 0 && yDelta > 80) || yVelocity > 500;
      if (isBeyondDismissThreshold) {
        if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
          SwapNavigation.handleDismissReview();
        } else if (configProgress.value === NavigationSteps.SHOW_GAS) {
          SwapNavigation.handleDismissGas();
        }
      }
      gestureY.value = withSpring(0, SPRING_CONFIGS.springConfig);
    },
  });

  return {
    swipeToDismissGestureHandler,
    gestureY,
  };
};
