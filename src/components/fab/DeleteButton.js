import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import { borders, colors } from '../../styles';
import Icon from '../icons/Icon';
import { ShadowStack } from '../shadow-stack';
import { buildFabShadow } from './FloatingActionButton';

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
        color="white"
        height="11"
        name="close"
        width="11"
      />
    </ShadowStack>
  </Animated.View>
);

DeleteButton.propTypes = {
  deleteButtonTranslate: PropTypes.object,
};

export default DeleteButton;
