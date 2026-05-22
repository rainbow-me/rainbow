import { memo, type PropsWithChildren } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { easing } from '@/components/animations/animationConfigs';

const ENTER_DURATION = 220;
const ENTER_DELAY_STEP = 35;
const MAX_STAGGER_INDEX = 6;

type ShowMoreCellEnterAnimationProps = PropsWithChildren<{
  index: number;
  style?: StyleProp<ViewStyle>;
}>;

export const ShowMoreCellEnterAnimation = memo(function ShowMoreCellEnterAnimation({
  children,
  index,
  style,
}: ShowMoreCellEnterAnimationProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(ENTER_DURATION)
        .easing(easing.bezier.fade)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })
        .delay(Math.min(index, MAX_STAGGER_INDEX) * ENTER_DELAY_STEP)}
      style={style}
    >
      {children}
    </Animated.View>
  );
});
