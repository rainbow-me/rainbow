import PropTypes from 'prop-types';
import React, {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';
import { useTimingTransition } from 'react-native-redash';
import { position } from '../../styles';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';

const TextCyclerItem = ({ children, duration, renderer, selected }) => (
  <Animated.View
    style={{
      ...position.coverAsObject,
      opacity: useTimingTransition(selected, duration, Easing.out(Easing.ease)),
    }}
  >
    {createElement(renderer, { children })}
  </Animated.View>
);

const TextCycler = ({
  defaultSelectedIndex,
  height,
  interval,
  items,
  renderer,
  ...props
}) => {
  const intervalRef = useRef();
  const timeoutRef = useRef();
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);

  const cycleText = useCallback(() => {
    setSelectedIndex(index => (index + 1 > items.length - 1 ? 0 : index + 1));
  }, [items]);

  const startInterval = useCallback(() => {
    intervalRef.current = setInterval(cycleText, interval);
  }, [cycleText, interval]);

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const stopTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    startInterval();
    return () => {
      stopInterval();
      stopTimeout();
    };
  }, [startInterval]);

  const handlePress = useCallback(() => {
    stopInterval();
    stopTimeout();
    cycleText();
    timeoutRef.current = setTimeout(startInterval, interval);
  }, [cycleText, interval, startInterval]);

  return (
    <TouchableOpacity activeOpacity={0.69} onPress={handlePress}>
      <Centered height={height} width="100%" {...props}>
        {items.map(item =>
          createElement(TextCyclerItem, {
            children: item,
            duration: interval,
            key: item,
            renderer,
            selected: item === items[selectedIndex],
          })
        )}
      </Centered>
    </TouchableOpacity>
  );
};

TextCycler.propTypes = {
  defaultSelectedIndex: PropTypes.number,
  height: PropTypes.number.isRequired,
  interval: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(PropTypes.string),
  renderer: PropTypes.func,
};

TextCycler.defaultProps = {
  defaultSelectedIndex: 0,
  interval: 3000,
  renderer: Text,
};

export default magicMemo(TextCycler, [
  'duration',
  'height',
  'interval',
  'items',
]);
