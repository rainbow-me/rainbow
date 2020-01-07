import { upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import Animated, {
  Easing,
  Transitioning,
  Transition,
} from 'react-native-reanimated';
import { useToggle } from 'react-native-redash';
import { withProps } from 'recompact';
import { gasUtils } from '../../utils';
import { interpolate } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import GasSpeedEmoji from './GasSpeedEmoji';

const { cond } = Animated;

const containerStyle = {
  bottom: 0,
  position: 'absolute',
  right: 0,
  top: 0,
};

export const GasSpeedLabelPagerItemHeight = 28;

const GasSpeedLabel = withProps({
  color: 'white',
  letterSpacing: 'tight',
  size: 'lmedium',
  weight: 'semibold',
})(Text);

const distance = 20;
const duration = 150;
const transition = (
  <Transition.Change durationMs={duration} interpolation="easeOut" />
);

const GasSpeedLabelPagerItem = ({ label, selected, shouldAnimate }) => {
  const ref = useRef();

  useEffect(() => {
    if (shouldAnimate && ref.current) {
      ref.current.animateNextTransition();
    }
  }, [shouldAnimate]);

  const index = gasUtils.GasSpeedOrder.indexOf(label);
  const isFirst = index === 0;
  const isLast = index === gasUtils.GasSpeedOrder.length - 1;

  const transitionVal = useToggle(
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
        inputRange: [0, 0.333, 1],
        outputRange: [1, 0.666, 0],
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
    <Transitioning.View
      ref={ref}
      style={containerStyle}
      transition={transition}
    >
      <Animated.View style={{ opacity, transform: [{ translateX }] }}>
        <Row align="end" height={GasSpeedLabelPagerItemHeight} justify="end">
          <GasSpeedEmoji label={label} />
          <GasSpeedLabel style={{ marginBottom: 3 }}>
            {upperFirst(label)}
          </GasSpeedLabel>
        </Row>
      </Animated.View>
    </Transitioning.View>
  );
};

GasSpeedLabelPagerItem.propTypes = {
  label: PropTypes.oneOf(gasUtils.GasSpeedOrder),
  selected: PropTypes.bool,
  shouldAnimate: PropTypes.bool,
};

export default React.memo(GasSpeedLabelPagerItem);
