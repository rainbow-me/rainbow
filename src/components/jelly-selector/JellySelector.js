import { sum } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement, Fragment, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { spring } from 'react-native-reanimated';
import { useValues } from 'react-native-redash';
import ShadowStack from 'react-native-shadow-stack';
import { useDimensions } from '../../hooks';
import { colors } from '../../styles';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';

const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

const horizontalMargin = 8;
const maxWidth = 300;

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
let itemPositions = [];
let itemWidths = [];

const calculatePosition = () => {
  const widthSum = sum(itemWidths);
  const center = widthSum / 2;
  let w = 0;
  for (let i = 0; i < itemWidths.length; i++) {
    itemPositions[i] = w + itemWidths[i] / 2 - center;
    w += itemWidths[i];
  }
};

const JellySelector = ({
  disableSelection,
  height,
  initialCurrencyIndex,
  items,
  onSelect,
  renderItem,
}) => {
  const { width: deviceWidth } = useDimensions();
  const [selected, setSelected] = useState(initialCurrencyIndex);
  const [translateX, width] = useValues([0, 0], []);

  useEffect(() => {
    itemWidths = [];
    itemPositions = [];

    return () => {
      calculatedItemWidths = 0;
    };
  }, []);

  const animateTransition = (index, skipAnimation) => {
    const nextTranslateX =
      itemPositions[index] + horizontalMargin * (index ? 0.5 : -0.5);
    const nextWidth = itemWidths[index];

    if (skipAnimation) {
      translateX.setValue(nextTranslateX);
      width.setValue(nextWidth);
    } else {
      springTo(translateX, nextTranslateX);
      springTo(width, nextWidth);
    }
  };

  return (
    <Fragment>
      <AnimatedShadowStack
        borderRadius={height / 2}
        height={height}
        marginBottom={height * -1}
        shadows={[
          [0, 0, 9, colors.shadowGrey, 0.1],
          [0, 5, 15, colors.shadowGrey, 0.12],
          [0, 10, 30, colors.shadowGrey, 0.06],
        ]}
        style={{ transform: [{ translateX }], width }}
        zIndex={10}
      />
      <RowWithMargins
        justify="center"
        margin={horizontalMargin}
        maxWidth={maxWidth}
        width={deviceWidth}
        zIndex={11}
      >
        {items.map((item, index) => (
          <View
            key={`jellyViewKey${item}`}
            onLayout={({ nativeEvent }) => {
              itemWidths[index] = nativeEvent.layout.width;
              calculatedItemWidths++;
              if (items.length === calculatedItemWidths) {
                calculatePosition();
                animateTransition(initialCurrencyIndex, true);
              }
            }}
          >
            <ButtonPressAnimation
              enableHapticFeedback={false}
              key={`jellyButtonKey${item}`}
              onPress={() => {
                if (!disableSelection) {
                  animateTransition(index);
                  setSelected(index);
                }
                onSelect(items[index]);
              }}
              scaleTo={0.94}
              style={{ width: itemWidths[index] }}
            >
              {createElement(renderItem, {
                isSelected: selected === index,
                item,
              })}
            </ButtonPressAnimation>
          </View>
        ))}
      </RowWithMargins>
    </Fragment>
  );
};

JellySelector.propTypes = {
  disableSelection: PropTypes.bool,
  height: PropTypes.number.isRequired,
  initialCurrencyIndex: PropTypes.number,
  items: PropTypes.array,
  onSelect: PropTypes.func,
  renderItem: PropTypes.func,
};

export default magicMemo(JellySelector, [
  'height',
  'initialCurrencyIndex',
  'items',
]);
