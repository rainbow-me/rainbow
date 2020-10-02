import { upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import Animated, {
  Easing,
  Transition,
  Transitioning,
} from 'react-native-reanimated';
import { useTimingTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { gasUtils } from '../../utils';
import { interpolate } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import GasSpeedEmoji from './GasSpeedEmoji';

const { cond } = Animated;

const AnimatedRow = Animated.createAnimatedComponent(Row);

export const GasSpeedLabelPagerItemHeight = 26;

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
  size: 'lmedium',
  weight: 'semibold',
})`
  margin-bottom: 3;
`;

const distance = 20;
const duration = 150;
const transition = (
  <Transition.Change durationMs={duration} interpolation="easeOut" />
);

const GasSpeedLabelPagerItem = ({ label, selected, shouldAnimate, theme }) => {
  const transitionRef = useRef();

  useEffect(() => {
    if (shouldAnimate) {
      transitionRef.current?.animateNextTransition();
    }
  }, [shouldAnimate]);

  const index = gasUtils.GasSpeedOrder.indexOf(label);
  const isFirst = index === 0;
  const isLast = index === gasUtils.GasSpeedOrder.length - 1;

  const transitionVal = useTimingTransition(
    !selected,
    duration + (isFirst ? 50 : 0),
    Easing.out(Easing.ease)
  );

  const defaultOpacity = selected ? 1 : 0;
  const opacity = cond(
    shouldAnimate,
    cond(
      selected,
      // animate in
      interpolate(transitionVal, {
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      // animate out
      interpolate(transitionVal, {
        inputRange: [0, 1],
        outputRange: [1, 0],
      })
    ),
    defaultOpacity
  );

  const defaultTranslateX = 0;
  const translateX = cond(
    shouldAnimate,
    cond(
      selected,
      // animate in
      interpolate(transitionVal, {
        inputRange: [0, 1],
        outputRange: [0, cond(isFirst, distance * -2, distance)],
      }),
      // animate out
      interpolate(transitionVal, {
        inputRange: [0, 1],
        outputRange: [0, cond(isLast, distance * 2, distance * -2)],
      })
    ),
    defaultTranslateX
  );

  return (
    <TransitionContainer ref={transitionRef} transition={transition}>
      <GasSpeedRow style={{ opacity, transform: [{ translateX }] }}>
        <GasSpeedEmoji
          containerHeight={GasSpeedLabelPagerItemHeight}
          label={label}
        />
        <GasSpeedLabel color={theme !== 'light' ? 'white' : null}>
          {upperFirst(label)}
        </GasSpeedLabel>
      </GasSpeedRow>
    </TransitionContainer>
  );
};

GasSpeedLabelPagerItem.propTypes = {
  label: PropTypes.oneOf(gasUtils.GasSpeedOrder),
  selected: PropTypes.bool,
  shouldAnimate: PropTypes.bool,
};

export default React.memo(GasSpeedLabelPagerItem);
