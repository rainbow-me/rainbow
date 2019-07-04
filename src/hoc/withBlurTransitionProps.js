import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import Animated from 'react-native-reanimated';
import withTransitionProps from './withTransitionProps';

const { interpolate } = Animated;

const transitionPropsSelector = state => state.transitionProps;

const withBlurTransitionProps = ({
  effect,
  isTransitioning,
  isExpanded,
  position,
}) => {
  const blurOpacity = interpolate(position, {
    inputRange: [0, 0.01, 1],
    outputRange: [0, 0.8, 1],
  });

  const showBlur = (effect === 'expanded') && (isTransitioning || isExpanded);

  return {
    blurOpacity,
    showBlur: (effect === 'expanded') && (isTransitioning || blurOpacity.__getValue() > 0),
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
