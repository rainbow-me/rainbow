import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import JellySelectorItem from './JellySelectorItem';
import JellySelectorRow from './JellySelectorRow';
import { JellySelectorColorIndicator, JellySelectorIndicator } from './jelly-selector-indicator';
import { magicMemo } from '@/utils';

const springConfig = {
  damping: 38,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 600,
};

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
  color: givenColor,
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
  const { colors } = useTheme();
  const color = givenColor ?? colors.dark;
  const [selected, setSelected] = useState(defaultIndex);
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);
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
        translateX.value = nextX;
        width.value = nextWidth;
      } else {
        translateX.value = withSpring(nextX, springConfig);
        width.value = withSpring(nextWidth, springConfig);
      }
    },
    [translateX, width]
  );

  const handleItemLayout = useCallback(
    (event, index) => {
      const itemWidth = event?.nativeEvent?.layout?.width ?? 0;
      const itemX = event?.nativeEvent?.layout?.x ?? 0;
      setSelectorVisible(true);

      positions[index] = Math.floor(itemX) - Math.floor(itemWidth / 2);
      widths[index] = Math.ceil(itemWidth);
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

export default magicMemo(JellySelector, ['backgroundColor', 'defaultIndex', 'height', 'items']);
