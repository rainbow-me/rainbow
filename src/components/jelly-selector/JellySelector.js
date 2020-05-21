import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useValues } from 'react-native-redash';
import { magicMemo } from '../../utils';
import JellySelectorItem from './JellySelectorItem';
import JellySelectorRow from './JellySelectorRow';
import {
  JellySelectorColorIndicator,
  JellySelectorIndicator,
} from './jelly-selector-indicator';

const springTo = (node, toValue) =>
  // eslint-disable-next-line import/no-named-as-default-member
  Animated.spring(node, {
    damping: 38,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: 600,
    toValue,
  }).start();

let calculatedItemWidths = 0;
let positions = [];
let widths = [];

function resetPositionCalculations() {
  calculatedItemWidths = 0;
  positions = [];
  widths = [];
}

const JellySelector = ({
  backgroundColor,
  defaultIndex,
  disableSelection,
  height,
  items,
  onSelect,
  renderIndicator,
  renderItem,
  renderRow,
  ...props
}) => {
  const [selected, setSelected] = useState(defaultIndex);
  const [translateX, width] = useValues([0, 0], []);

  useEffect(() => {
    resetPositionCalculations();
    return () => resetPositionCalculations();
  }, []);

  const animateTransition = useCallback(
    (index, skipAnimation) => {
      const nextWidth = widths[index];
      const nextX = positions[index] + widths[index] / 2;

      if (skipAnimation) {
        translateX.setValue(nextX);
        width.setValue(nextWidth);
      } else {
        springTo(translateX, nextX);
        springTo(width, nextWidth);
      }
    },
    [translateX, width]
  );

  const handleItemLayout = useCallback(
    (event, index) => {
      const itemWidth = get(event, 'nativeEvent.layout.width', 0);
      const itemX = get(event, 'nativeEvent.layout.x', 0);

      positions[index] = Math.floor(itemX) - Math.floor(itemWidth / 2);
      widths[index] = Math.floor(itemWidth);
      calculatedItemWidths++;

      if (items.length === calculatedItemWidths) {
        animateTransition(defaultIndex, true);
      }
    },
    [animateTransition, defaultIndex, items.length]
  );

  const handleItemPress = useCallback(
    (event, index) => {
      if (!disableSelection) {
        animateTransition(index);
        setSelected(index);
      }
      onSelect(items[index]);
    },
    [animateTransition, disableSelection, items, onSelect]
  );

  return (
    <View {...props}>
      <JellySelectorIndicator
        backgroundColor={backgroundColor}
        height={height}
        renderIndicator={renderIndicator}
        translateX={translateX}
        width={width}
      />
      <JellySelectorRow renderRow={renderRow}>
        {items.map((item, index) => (
          <JellySelectorItem
            index={index}
            isSelected={selected === index}
            item={item}
            key={item}
            onLayout={handleItemLayout}
            onPress={handleItemPress}
            renderItem={renderItem}
            width={widths[index]}
          />
        ))}
      </JellySelectorRow>
    </View>
  );
};

JellySelector.propTypes = {
  backgroundColor: PropTypes.string,
  defaultIndex: PropTypes.number,
  disableSelection: PropTypes.bool,
  height: PropTypes.number.isRequired,
  items: PropTypes.array,
  onSelect: PropTypes.func,
  renderIndicator: PropTypes.func,
  renderItem: PropTypes.func,
  renderRow: PropTypes.func,
};

JellySelector.defaultProps = {
  defaultIndex: 0,
  renderIndicator: JellySelectorColorIndicator,
};

export default magicMemo(JellySelector, [
  'backgroundColor',
  'defaultIndex',
  'height',
  'items',
]);
