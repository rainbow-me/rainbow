import { compose, withProps } from 'recompact';
import withTransitionProps from './withTransitionProps';

const blurOpacityInterpolation = {
  inputRange: [0, 0.01, 1],
  outputRange: [0, 1, 1],
};

export default Component => compose(
  withTransitionProps,
  withProps(({
    transitionProps: {
      effect,
      isTransitioning,
      position,
    },
  }) => ({
    blurOpacity: position.interpolate(blurOpacityInterpolation),
    showBlur: effect === 'expanded' && (isTransitioning || position._value > 0),
  })),
)(Component);
