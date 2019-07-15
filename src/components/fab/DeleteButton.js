import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import { borders, colors, position } from '../../styles';
import { Icon } from '../icons';
import { ShadowStack } from '../shadow-stack';
import FloatingActionButton, { buildFabShadow } from './FloatingActionButton';

const DeleteButton = ({ deleteButtonTranslate }) => (
  <Animated.View
    style={{
      ...position.sizeAsObject(50),
      bottom: 44,
      position: 'absolute',
      right: (FloatingActionButton.size / 2) - (50 / 2),
      transform: [{ translateY: deleteButtonTranslate }],
    }}
  >
    <ShadowStack
      {...borders.buildCircleAsObject(34)}
      backgroundColor={colors.dark}
      shadows={buildFabShadow(false)}
    >
      <Icon
        {...position.sizeAsObject(11)}
        color="white"
        name="close"
      />
    </ShadowStack>
  </Animated.View>
);

DeleteButton.propTypes = {
  deleteButtonTranslate: PropTypes.object,
};

export default DeleteButton;
