import Animated from 'react-native-reanimated';
import React from 'react';
import PropTypes from 'prop-types';
import { ShadowStack } from '../shadow-stack';
import { borders, colors } from '../../styles';
import { buildFabShadow } from './FloatingActionButton';
import Icon from '../icons/Icon';

const DeleteButton = ({ deleteButtonTranslate }) => (
  <Animated.View
    style={{
      bottom: 44,
      height: 50,
      position: 'absolute',
      right: 26,
      transform: [{
        translateY: deleteButtonTranslate,
      }],
      width: 50,
    }}
  >
    <ShadowStack
      {...borders.buildCircleAsObject(34)}
      backgroundColor={colors.dark}
      shadows={buildFabShadow(false)}
    >
      <Icon
        name="close"
        width="11"
        height="11"
        color="white"
      />
    </ShadowStack>
  </Animated.View>
);

DeleteButton.propTypes = {
  deleteButtonTranslate: PropTypes.object,
}

export default DeleteButton;
