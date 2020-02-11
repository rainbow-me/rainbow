import { sum } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement, Fragment, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useValues } from 'react-native-redash';
import { colors } from '../../styles';
import { deviceUtils, isNewValueForObjectPaths } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';

const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

const springConfig = {
  damping: 38,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 600,
};

const horizontalMargin = 8;
const maxWidth = 300;

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

const JellySelectorShadow = [
  [0, 0, 9, colors.shadowGrey, 0.1],
  [0, 5, 15, colors.shadowGrey, 0.12],
  [0, 10, 30, colors.shadowGrey, 0.06],
];

const JellySelector = ({
  height,
  initialCurrencyIndex,
  items,
  onSelect,
  renderItem,
}) => {
  const [selected, setSelected] = useState(initialCurrencyIndex);
  const [translateX, width] = useValues([0, 0], []);

  useEffect(() => {
    itemWidths = [];
    itemPositions = [];

    return () => {
      calculatedItemWidths = 0;
    };
  }, []);

  const animateTransition = index => {
    Animated.spring(translateX, {
      toValue: itemPositions[index] + horizontalMargin * (index ? 0.5 : -0.5),
      ...springConfig,
    }).start();
    Animated.spring(width, {
      toValue: itemWidths[index],
      ...springConfig,
    }).start();
  };

  return (
    <Fragment>
      <AnimatedShadowStack
        borderRadius={height / 2}
        height={height}
        marginBottom={height * -1}
        shadows={JellySelectorShadow}
        style={{ transform: [{ translateX }], width }}
        zIndex={10}
      />
      <RowWithMargins
        justify="center"
        margin={horizontalMargin}
        maxWidth={maxWidth}
        width={deviceUtils.dimensions.width}
        zIndex={11}
      >
        {items.map((item, index) => (
          <View
            key={index}
            onLayout={({ nativeEvent }) => {
              itemWidths[index] = nativeEvent.layout.width;
              calculatedItemWidths++;
              if (items.length === calculatedItemWidths) {
                calculatePosition();
                animateTransition(initialCurrencyIndex);
              }
            }}
          >
            <ButtonPressAnimation
              enableHapticFeedback={false}
              key={index}
              onPress={() => {
                animateTransition(index);
                setSelected(index);
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
  height: PropTypes.number.isRequired,
  initialCurrencyIndex: PropTypes.number,
  items: PropTypes.array,
  onSelect: PropTypes.func,
  renderItem: PropTypes.func,
};

const arePropsEqual = (...props) =>
  !isNewValueForObjectPaths(...props, [
    'height',
    'initialCurrencyIndex',
    'items',
  ]);

export default React.memo(JellySelector, arePropsEqual);
