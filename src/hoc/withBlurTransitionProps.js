import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import withTransitionProps from './withTransitionProps';

const blurOpacityInterpolation = {
  inputRange: [0, 0.01, 1],
  outputRange: [0, 1, 1],
};

const transitionPropsSelector = state => state.transitionProps;

const withBlurTransitionProps = ({ effect, isTransitioning, position }) => {
  const blurOpacity = position.interpolate(blurOpacityInterpolation);
  const showBlur = (effect === 'expanded') && (isTransitioning || blurOpacity.__getValue() > 0);

  return {
    blurOpacity,
    showBlur,
  };
};

const withBlurTransitionPropsSelector = createSelector(
  [transitionPropsSelector],
  withBlurTransitionProps,
);

export default Component => compose(
  withTransitionProps,
  withProps(withBlurTransitionPropsSelector),
)(Component);
