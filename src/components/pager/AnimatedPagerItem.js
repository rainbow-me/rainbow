import PropTypes from 'prop-types';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { position } from '../../styles';
import { FlexItem } from '../layout';

const styles = StyleSheet.create({
  item: {
    ...position.coverAsObject,
    overflow: 'hidden',
  },
});

const AnimatedPagerItem = ({ children, translateX, ...props }) => (
  <Animated.View
    {...props}
    style={[styles.item, { transform: [{ translateX }] }]}
  >
    <FlexItem>
      {children}
    </FlexItem>
  </Animated.View>
);

AnimatedPagerItem.propTypes = {
  translateX: PropTypes.object.isRequired,
};

export default AnimatedPagerItem;
