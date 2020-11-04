import { get } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { spring } from 'react-native-reanimated';
import { useValues } from 'react-native-redash';
import JellySelectorItem from './JellySelectorItem';
import JellySelectorRow from './JellySelectorRow';
import {
  JellySelectorColorIndicator,
  JellySelectorIndicator,
} from './jelly-selector-indicator';
import { colors } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const springTo = (node, toValue) =>
  spring(node, {
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
  color = colors.dark,
  defaultIndex = 0,
  disableSelection,
  enableHapticFeedback,
  height,
  items,
  onSelect,
  renderIndicator = JellySelectorColorIndicator,
  renderItem,
  renderRow,
  scaleTo,
  ...props
}) => {
  const [selected, setSelected] = useState(defaultIndex);
  const [translateX, width] = useValues(0, 0);
  const [selectorVisible, setSelectorVisible] = useState(false);

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
      setSelectorVisible(true);

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
      {selectorVisible ? (
        <JellySelectorIndicator
          backgroundColor={backgroundColor}
          height={height}
          renderIndicator={renderIndicator}
          translateX={translateX}
          width={width}
        />
      ) : null}
      <JellySelectorRow height={height} renderRow={renderRow}>
        {items.map((item, index) => (
          <JellySelectorItem
            color={color}
            enableHapticFeedback={enableHapticFeedback}
            index={index}
            isSelected={selected === index}
            item={item}
            key={item}
            onLayout={handleItemLayout}
            onPress={handleItemPress}
            renderItem={renderItem}
            scaleTo={scaleTo}
            testID={`chart-timespan-${item}`}
            width={widths[index]}
          />
        ))}
      </JellySelectorRow>
    </View>
  );
};

export default magicMemo(JellySelector, [
  'backgroundColor',
  'defaultIndex',
  'height',
  'items',
]);
