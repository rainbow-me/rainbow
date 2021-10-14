import { upperFirst } from 'lodash';
import React, { useEffect } from 'react';
import Animated, {
  Transition,
  Transitioning,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { Row } from '../layout';
import { Text } from '../text';
import GasSpeedEmoji from './GasSpeedEmoji';
import { margin } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';

const AnimatedRow = Animated.createAnimatedComponent(Row);

const springConfig = {
  damping: 60,
  mass: 1.5,
  stiffness: 1200,
};

const GasSpeedRow = styled(AnimatedRow)``;

const TransitionContainer = styled(Transitioning.View)``;

const GasSpeedLabel = styled(Text).attrs({
  align: 'right',
  size: 'lmedium',
  weight: 'heavy',
})`
  ${margin(0, 4, 0, 4)}
`;

const duration = 150;
const transition = (
  <Transition.Change durationMs={duration} interpolation="easeOut" />
);

const GasSpeedLabelPagerItem = ({ label, selected, shouldAnimate, theme }) => {
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const { colors } = useTheme();

  const index = gasUtils.GasSpeedOrder.indexOf(label);
  const isFirst = index === 0;
  const isLast = index === gasUtils.GasSpeedOrder.length - 1;

  useEffect(() => {
    if (shouldAnimate) {
      if (selected) {
        opacity.value = withSpring(1, springConfig);
      } else {
        opacity.value = withSpring(0, springConfig);
      }
    }
  }, [isFirst, isLast, opacity, selected, shouldAnimate]);

  return (
    <TransitionContainer transition={transition}>
      <GasSpeedRow style={animatedStyle}>
        <GasSpeedEmoji label={label} />
        <GasSpeedLabel
          color={
            theme !== 'light'
              ? colors.whiteLabel
              : colors.alpha(colors.blueGreyDark, 0.8)
          }
        >
          {upperFirst(label)}
        </GasSpeedLabel>
      </GasSpeedRow>
    </TransitionContainer>
  );
};

export default React.memo(GasSpeedLabelPagerItem);
