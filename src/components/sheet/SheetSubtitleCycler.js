import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { magicMemo } from '../../utils';

import { Centered } from '../layout';
import { Text } from '../text';
import { useInterval, useTimeout } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

const AnimatedText = Animated.createAnimatedComponent(Text);

const SheetSubtitleCyclerItem = ({ error, selected, subtitle }) => {
  const easing = useMemo(() => Easing[error ? 'out' : 'in'](Easing.ease), [
    error,
  ]);
  const opacity = useSharedValue(selected ? 1 : 0);
  const colorProgress = useSharedValue(error ? 1 : 0);

  useLayoutEffect(() => {
    opacity.value = withTiming(selected ? 1 : 0, {
      duration: 200,
      easing,
    });
    colorProgress.value = withTiming(error ? 1 : 0, {
      duration: error ? 50 : 200,
    });
  }, [selected, error, colorProgress, easing, opacity]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const { colors } = useTheme();

  const colorProps = useAnimatedProps(() => {
    const colorValue = interpolateColor(
      colorProgress.value,
      [0, 1],
      [colors.blueGreyDark50, colors.brightRed]
    );

    return {
      color: colorValue,
    };
  });

  return (
    <Animated.View {...position.coverAsObject} style={opacityStyle}>
      <AnimatedText
        align="center"
        animatedProps={colorProps}
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
  sharedValue,
  defaultSelectedIndex,
  errorIndex,
  interval,
  items,
  ...props
}) => {
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);

  const [startInterval, stopInterval] = useInterval();
  const [startTimeout, stopTimeout] = useTimeout();
  const clearTimers = useCallback(() => {
    stopInterval();
    stopTimeout();
  }, [stopInterval, stopTimeout]);

  const cycleTextOnce = useCallback(
    () => setSelectedIndex(i => (i + 1) % items.length),
    [items]
  );

  const startCycling = useCallback(
    () => startInterval(() => cycleTextOnce(), interval),
    [cycleTextOnce, interval, startInterval]
  );

  useEffect(() => {
    if (errorIndex !== null) {
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

  const scaleStyle = useAnimatedStyle(() => {
    const scale =
      errorIndex !== null
        ? interpolate(
            sharedValue.value,
            [-20, -10, 0, 10, 20],
            [1.025, 1.25, 1, 1.25, 1.025],
            'extend'
          )
        : 1;

    return {
      transform: [{ scale }],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Centered width="100%" {...props}>
        <Animated.View {...position.coverAsObject} style={scaleStyle}>
          {items.map((subtitle, index) => (
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
  defaultSelectedIndex: PropTypes.number,
  errorIndex: PropTypes.number,
  interval: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(PropTypes.string),
  sharedValue: PropTypes.object,
};

SheetSubtitleCycler.defaultProps = {
  defaultSelectedIndex: 0,
  interval: 3000,
};

export default magicMemo(SheetSubtitleCycler, [
  'sharedValue',
  'errorIndex',
  'interval',
  'items',
]);
