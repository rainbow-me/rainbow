import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import { transformOrigin } from 'react-native-redash';
import { onlyUpdateForKeys } from 'recompact';
import { borders, colors, position } from '../../styles';
import { Icon } from '../icons';
import { ShadowStack } from '../shadow-stack';
import FloatingActionButton from './FloatingActionButton';

const size = 34;

const enhance = onlyUpdateForKeys(['deleteButtonScale']);
const DeleteButton = enhance(({ deleteButtonScale }) => (
  <Animated.View
    style={{
      ...position.centeredAsObject,
      ...position.sizeAsObject(size),
      position: 'absolute',
      transform: transformOrigin(size / -8, size / -8, { scale: deleteButtonScale }),
    }}
  >
    <ShadowStack
      {...borders.buildCircleAsObject(size)}
      backgroundColor={colors.dark}
      shadows={FloatingActionButton.shadow}
    >
      <Icon
        color="white"
        name="close"
        size={12}
      />
    </ShadowStack>
  </Animated.View>
));

DeleteButton.propTypes = {
  deleteButtonScale: PropTypes.object,
};

DeleteButton.size = size;

DeleteButton.defaultScale = 1.25;

export default DeleteButton;
