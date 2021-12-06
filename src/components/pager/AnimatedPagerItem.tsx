import PropTypes from 'prop-types';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { FlexItem } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const styles = StyleSheet.create({
  item: {
    ...position.coverAsObject,
    overflow: 'hidden',
  },
});

const AnimatedPagerItem = ({ children, translateX, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Animated.View
    {...props}
    style={[styles.item, { transform: [{ translateX }] }]}
  >
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <FlexItem style={position.sizeAsObject('100%')}>{children}</FlexItem>
  </Animated.View>
);

AnimatedPagerItem.propTypes = {
  children: PropTypes.node,
  translateX: PropTypes.object.isRequired,
};

export default AnimatedPagerItem;
