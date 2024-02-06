import PropTypes from 'prop-types';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { FlexItem } from '../layout';
import { position } from '@/styles';

const styles = StyleSheet.create({
  item: {
    ...position.coverAsObject,
    overflow: 'hidden',
  },
});

const AnimatedPagerItem = ({ children, translateX, ...props }) => (
  <Animated.View {...props} style={[styles.item, { transform: [{ translateX }] }]}>
    <FlexItem style={position.sizeAsObject('100%')}>{children}</FlexItem>
  </Animated.View>
);

AnimatedPagerItem.propTypes = {
  children: PropTypes.node,
  translateX: PropTypes.object.isRequired,
};

export default AnimatedPagerItem;
