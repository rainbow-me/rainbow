import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import Animated from 'react-native-reanimated';
import withTransitionProps from './withTransitionProps';

const { interpolate } = Animated;

const transitionPropsSelector = state => state.transitionProps;

const withBlurTransitionProps = ({
  effect,
  isTransitioning,
  showingModal,
  position,
}) => {
  const blurOpacity = interpolate(position, {
    inputRange: [0, 0.9, 1],
    outputRange: [0, 0.1, 1],
  });

  const showBlur = (effect === 'expanded') && (isTransitioning || showingModal);

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
