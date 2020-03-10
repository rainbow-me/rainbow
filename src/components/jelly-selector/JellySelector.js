import { get, sum } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useValues } from 'react-native-redash';
import { useDimensions } from '../../hooks';
import { position } from '../../styles';
import { magicMemo } from '../../utils';
import { Centered, Row } from '../layout';
import JellySelectorIndicator from './JellySelectorIndicator';
import JellySelectorItem from './JellySelectorItem';

const horizontalMargin = 100;
const maxWidth = 300;

const springTo = (node, toValue) =>
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

const JellySelector = ({
  backgroundColor,
  defaultIndex,
  disableSelection,
  height,
  items,
  onSelect,
  renderItem,
}) => {
  const { width: deviceWidth } = useDimensions();
  const [selected, setSelected] = useState(defaultIndex);
  const [translateX, width] = useValues([0, 0], []);

  useEffect(() => {
    widths = [];
    positions = [];

    return () => {
      calculatedItemWidths = 0;
    };
  }, []);

  const animateTransition = useCallback(
    (index, skipAnimation) => {
      const nextWidth = widths[index];
      const nextX = positions[index]; // + widths[index] / 2;

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
      console.log('happening', index, get(event, 'nativeEvent.layout'));

      const itemWidth = get(event, 'nativeEvent.layout.width');
      const itemX = get(event, 'nativeEvent.layout.x');

      widths[index] = Math.floor(itemWidth);
      positions[index] = Math.floor(itemWidth / 2 + itemX);

      calculatedItemWidths++;

      if (items.length === calculatedItemWidths) {
        animateTransition(defaultIndex, true);
      }
    },
    [animateTransition, defaultIndex, items.length]
  );

  const handleItemPress = useCallback(
    (event, index) => {
      console.log('ITEM PRESS', index);
      if (!disableSelection) {
        animateTransition(index);
        setSelected(index);
      }
      onSelect(items[index]);
    },
    [animateTransition, disableSelection, items, onSelect]
  );

  console.log(' ');
  console.log('👋️');
  console.log('widths', widths);
  console.log('positions', positions);
  console.log(' ');

  return (
    <Centered width="100%" height={32} paddingHorizontal={15}>
      <JellySelectorIndicator
        backgroundColor={backgroundColor}
        translateX={translateX}
        width={width}
      />
      <Row
        justify="space-between"
        left={15}
        position="absolute"
        right={15}
        top={0}
        width="100%"
        zIndex={11}
      >
        {items.map((item, index) => (
          <JellySelectorItem
            index={index}
            isSelected={selected === index}
            item={item}
            key={index}
            onLayout={handleItemLayout}
            onPress={handleItemPress}
            renderItem={renderItem}
            width={widths[index]}
          />
        ))}
      </Row>
    </Centered>
  );
};

JellySelector.propTypes = {
  backgroundColor: PropTypes.string,
  defaultIndex: PropTypes.number,
  disableSelection: PropTypes.bool,
  height: PropTypes.number.isRequired,
  items: PropTypes.array,
  onSelect: PropTypes.func,
  renderItem: PropTypes.func,
};

JellySelector.defaultProps = {
  defaultIndex: 0,
};

export default JellySelector;


// magicMemo(JellySelector, [
//   'backgroundColor',
//   'height',
//   'defaultIndex',
//   'items',
// ]);
