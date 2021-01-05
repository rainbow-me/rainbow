import { upperFirst } from 'lodash';
import React, { useEffect } from 'react';
import Animated, {
  Transition,
  Transitioning,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import { Text } from '../text';
import GasSpeedEmoji from './GasSpeedEmoji';
import { colors } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';

const AnimatedRow = Animated.createAnimatedComponent(Row);

const springConfig = {
  damping: 60,
  mass: 1.5,
  stiffness: 1200,
};

export const GasSpeedLabelPagerItemHeight = 23.5;

const GasSpeedRow = styled(AnimatedRow).attrs({
  align: 'end',
  justify: 'end',
})`
  height: ${GasSpeedLabelPagerItemHeight};
`;

const TransitionContainer = styled(Transitioning.View)`
  bottom: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const GasSpeedLabel = styled(Text).attrs({
  align: 'right',
  size: 'lmedium',
  weight: 'bold',
})``;

const distance = 20;
const duration = 150;
const transition = (
  <Transition.Change durationMs={duration} interpolation="easeOut" />
);

const GasSpeedLabelPagerItem = ({ label, selected, shouldAnimate, theme }) => {
  const opacity = useSharedValue(0);
  const positionX = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateX: positionX.value }],
    };
  });

  const index = gasUtils.GasSpeedOrder.indexOf(label);
  const isFirst = index === 0;
  const isLast = index === gasUtils.GasSpeedOrder.length - 1;

  useEffect(() => {
    if (shouldAnimate) {
      if (selected) {
        positionX.value = isFirst ? -distance * 3 : distance;
        opacity.value = withSpring(1, springConfig);
        positionX.value = withSpring(0, springConfig);
      } else {
        opacity.value = withSpring(0, springConfig);
        positionX.value = isLast
          ? withSpring(distance * 3, springConfig)
          : withSpring(distance * -1, springConfig);
      }
    }
  }, [isFirst, isLast, opacity, positionX, selected, shouldAnimate]);

  return (
    <TransitionContainer transition={transition}>
      <GasSpeedRow style={animatedStyle}>
        <GasSpeedEmoji
          containerHeight={GasSpeedLabelPagerItemHeight}
          label={label}
        />
        <GasSpeedLabel
          color={
            theme !== 'light'
              ? colors.white
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
