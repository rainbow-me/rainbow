import PropTypes from 'prop-types';
import React, {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { useTimingTransition } from 'react-native-redash';
import { position } from '../../styles';
import { isNewValueForObjectPaths } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';

const TextCyclerItem = ({ children, duration, renderer, selected }) => (
  <Animated.View
    style={{
      ...position.coverAsObject,
      opacity: useTimingTransition(
        selected,
        duration,
        Easing.inOut(Easing.ease)
      ),
    }}
  >
    {createElement(renderer, { children })}
  </Animated.View>
);

const TextCycler = ({
  defaultSelectedIndex,
  duration,
  height,
  interval,
  items,
  renderer,
  ...props
}) => {
  const intervalRef = useRef();
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);

  const cycleText = useCallback(() => {
    setSelectedIndex(index => (index + 1 > items.length - 1 ? 0 : index + 1));
  }, [items]);

  useEffect(() => {
    intervalRef.current = setInterval(cycleText, interval);
    return () => clearInterval(intervalRef.current);
  }, [cycleText, interval]);

  return (
    <Centered height={height} width="100%" {...props}>
      {items.map(item =>
        createElement(TextCyclerItem, {
          children: item,
          duration,
          key: item,
          renderer,
          selected: item === items[selectedIndex],
        })
      )}
    </Centered>
  );
};

TextCycler.propTypes = {
  defaultSelectedIndex: PropTypes.number,
  duration: PropTypes.number,
  height: PropTypes.number.isRequired,
  interval: PropTypes.number,
  items: PropTypes.arrayOf(PropTypes.string),
  renderer: PropTypes.func,
};

TextCycler.defaultProps = {
  defaultSelectedIndex: 0,
  duration: 250,
  interval: 2500,
  renderer: Text,
};

const arePropsEqual = (...props) =>
  !isNewValueForObjectPaths(...props, [
    'duration',
    'height',
    'interval',
    'items',
  ]);

export default React.memo(TextCycler, arePropsEqual);
