import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Animated, { EasingNode } from 'react-native-reanimated';
import { mixColor, useTimingTransition } from 'react-native-redash/src/v1';
import { magicMemo } from '../../utils';

import { interpolate } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useInterval, useTimeout, useTransformOrigin } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const AnimatedText = Animated.createAnimatedComponent(Text);

const SheetSubtitleCyclerItem = ({ error, selected, subtitle }: any) => {
  const ease = EasingNode[error ? 'out' : 'in'](EasingNode.ease);

  const opacity = useTimingTransition(selected, {
    duration: 200,
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ duration: number; ease: Animat... Remove this comment to see the full error message
    ease,
  });

  const textColorAnimation = useTimingTransition(error, {
    duration: error ? 50 : 200,
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ duration: number; ease: Animat... Remove this comment to see the full error message
    ease,
  });

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View {...position.coverAsObject} style={{ opacity }}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AnimatedText
        // @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: any; align: string; color: Anima... Remove this comment to see the full error message
        align="center"
        color={mixColor(
          textColorAnimation,
          colors.blueGreyDark50,
          colors.brightRed
        )}
        letterSpacing="uppercase"
        size="smedium"
        uppercase
        weight="semibold"
      >
        {subtitle}
      </AnimatedText>
    </Animated.View>
  );
};

const MemoizedSheetSubtitleCyclerItem = React.memo(SheetSubtitleCyclerItem);

const SheetSubtitleCycler = ({
  animatedValue,
  defaultSelectedIndex,
  errorIndex,
  interval,
  items,
  ...props
}: any) => {
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);
  const { onLayout, withTransformOrigin } = useTransformOrigin('top');

  const [startInterval, stopInterval] = useInterval();
  const [startTimeout, stopTimeout] = useTimeout();
  const clearTimers = useCallback(() => {
    stopInterval();
    stopTimeout();
  }, [stopInterval, stopTimeout]);

  const cycleTextOnce = useCallback(
    () => setSelectedIndex((i: any) => (i + 1) % items.length),
    [items]
  );

  const startCycling = useCallback(
    () => startInterval(() => cycleTextOnce(), interval),
    [cycleTextOnce, interval, startInterval]
  );

  useEffect(() => {
    if (!isNil(errorIndex)) {
      clearTimers();
      setSelectedIndex(errorIndex);
    } else {
      stopInterval();
      startCycling();
    }
  }, [clearTimers, errorIndex, startCycling, stopInterval]);

  const handlePress = useCallback(() => {
    clearTimers();
    cycleTextOnce();
    startTimeout(() => startCycling(), interval);
  }, [clearTimers, cycleTextOnce, interval, startCycling, startTimeout]);

  const scale = Animated.cond(
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'boolean' is not assignable to pa... Remove this comment to see the full error message
    !isNil(errorIndex),
    interpolate(animatedValue, {
      inputRange: [-20, -10, 0, 10, 20],
      outputRange: [1.025, 1.25, 1, 1.25, 1.025],
    }),
    1
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TouchableWithoutFeedback onPress={handlePress}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered width="100%" {...props}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Animated.View
          {...position.coverAsObject}
          onLayout={onLayout}
          style={{ transform: withTransformOrigin({ scale }) }}
        >
          {items.map((subtitle: any, index: any) => (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <MemoizedSheetSubtitleCyclerItem
              error={index === errorIndex}
              key={subtitle}
              selected={index === selectedIndex}
              subtitle={subtitle}
            />
          ))}
        </Animated.View>
      </Centered>
    </TouchableWithoutFeedback>
  );
};

SheetSubtitleCycler.propTypes = {
  animatedValue: PropTypes.object,
  defaultSelectedIndex: PropTypes.number,
  errorIndex: PropTypes.number,
  interval: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(PropTypes.string),
};

SheetSubtitleCycler.defaultProps = {
  defaultSelectedIndex: 0,
  interval: 3000,
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(SheetSubtitleCycler, [
  'animatedValue',
  'errorIndex',
  'interval',
  'items',
]);
