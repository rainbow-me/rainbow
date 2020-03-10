import PropTypes from 'prop-types';
import React, { createElement, useCallback } from 'react';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';

const JellySelectorItem = ({
  index,
  isSelected,
  item,
  onLayout,
  onPress,
  renderItem,
  width,
}) => {
  const handleLayout = useCallback(e => onLayout(e, index), [index, onLayout]);
  const handlePress = useCallback(e => onPress(e, index), [index, onPress]);
//
      // style={{ width }}
  return (
    <ButtonPressAnimation
      enableHapticFeedback={false}
      key={index}
      onLayout={handleLayout}
      onPress={handlePress}
      scaleTo={0.94}
    >
      {createElement(renderItem, {
        isSelected,
        item,
      })}
    </ButtonPressAnimation>
  );
};

export default JellySelectorItem;

      // <Centered>
      // </Centered>
